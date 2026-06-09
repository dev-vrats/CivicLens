import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Extend Vercel function timeout to 60s (max on Hobby plan)
// Streaming AI responses often take 5–30 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are CivicLens AI, an expert civic issue assistant for the CivicLens platform.
Your role is to:
1. Analyze images of civic problems (potholes, broken infrastructure, flooding, illegal dumping, etc.)
2. Provide a clear, empathetic assessment of the severity and type of issue
3. Confirm the reported GPS location and contextualize it
4. Ask ONE relevant follow-up question to gather more useful information for civic authorities (e.g., landmarks, frequency of the issue, traffic impact, recent changes)
5. Offer practical advice on what residents can do in the interim

Tone: Professional yet warm and approachable. Use clear language without jargon.
Format: Use short paragraphs. Keep responses concise (under 200 words unless analysis requires more).
Important: Always end your first response with exactly one follow-up question.`;

export async function POST(req: NextRequest) {
  // Guard: key must exist before we even try to initialize the client
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server. Add it in Vercel → Settings → Environment Variables, then redeploy." },
      { status: 503 }
    );
  }

  try {
    const { text, imageUrl, lat, lng, history } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text in request" }, { status: 400 });
    }

    // Initialize client inside the handler so it always picks up the live env var
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Build current message parts
    const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

    // On first message with image: fetch + embed as base64
    if (imageUrl && history.length === 0) {
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          userParts.push({ inlineData: { mimeType: contentType, data: base64 } });
        }
      } catch {
        // Image fetch failed — continue without it
      }
    }

    const locationContext = lat && lng
      ? `[Reported location: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E]\n\n`
      : "";
    userParts.push({ text: `${locationContext}${text}` });

    // Build full conversation with system preamble
    const contents = [
      { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model" as const, parts: [{ text: "Understood. I'm ready to assist as CivicLens AI." }] },
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      })),
      { role: "user" as const, parts: userParts },
    ];

    // Stream the response
    const result = await model.generateContentStream({ contents });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) controller.enqueue(encoder.encode(chunkText));
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
        "Cache-Control": "no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    console.error("[/api/chat] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
