import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are CivicLens AI, an expert civic issue assistant for the CivicLens platform.
Your role is to:
1. Analyze images of civic problems (potholes, broken infrastructure, flooding, illegal dumping, etc.)
2. Provide a clear, empathetic assessment of the severity and type of issue
3. Confirm the reported GPS location and contextualize it
4. Ask ONE relevant follow-up question to gather more useful information for civic authorities (e.g., landmarks, frequency of the issue, traffic impact, recent changes)
5. Offer practical advice on what residents can do in the interim

Tone: Professional yet warm and approachable. Use clear language without jargon.
Format: Use short paragraphs and occasional emojis (🚧🗺️📋✅) for readability. Keep responses concise (under 200 words unless analysis requires more).
Important: Always end your first response with exactly one follow-up question.`;

export async function POST(req: NextRequest) {
  try {
    const { text, imageUrl, lat, lng, history } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text in request" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Build the content parts for the current message
    const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

    // If this is the first message and we have an image, fetch and embed it
    if (imageUrl && history.length === 0) {
      try {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error("Could not fetch image");
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        userParts.push({ inlineData: { mimeType: contentType, data: base64 } });
      } catch {
        // If image fetch fails, continue without it
      }
    }

    // Add location context and user text
    const locationContext = lat && lng
      ? `[Reported location: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E]\n\n`
      : "";
    userParts.push({ text: `${locationContext}${text}` });

    // Build conversation history for multi-turn chat
    const contents = [
      // System instruction as first user turn (Gemini doesn't have a dedicated system role in the API)
      {
        role: "user" as const,
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model" as const,
        parts: [{ text: "Understood. I'm ready to assist as CivicLens AI." }],
      },
      // Prior conversation history
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      })),
      // Current user message
      {
        role: "user" as const,
        parts: userParts,
      },
    ];

    // Stream the response
    const result = await model.generateContentStream({ contents });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    console.error("[/api/chat] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
