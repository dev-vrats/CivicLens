import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        lat: data.lat,
        lng: data.lng,
        imageUrl: data.imageUrl,
        description: data.description,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });
    return NextResponse.json({ reports });
  } catch (err: unknown) {
    console.error("[/api/reports] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
