import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AnalysisType } from "@/lib/fraudEngine";
import { callPythonBackend } from "@/lib/backendClient";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: AnalysisType;
      content?: string;
      latitude?: number | null;
      longitude?: number | null;
      city?: string | null;
    };

    if (!body.type || !["url", "text", "image"].includes(body.type)) {
      return NextResponse.json({ message: "Tipe analisis tidak valid." }, { status: 400 });
    }

    if (!body.content || body.content.trim().length < 5) {
      return NextResponse.json({ message: "Input terlalu pendek untuk dianalisis." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const result = await callPythonBackend("/analyze", {
      method: "POST",
      body: JSON.stringify({
        type: body.type,
        content: body.content,
        user_email: session?.user?.email ?? null,
        latitude: typeof body.latitude === "number" ? body.latitude : null,
        longitude: typeof body.longitude === "number" ? body.longitude : null,
        city: body.city ?? null
      })
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Core analysis unavailable", error);
    const message = error instanceof Error ? error.message : "Analisis belum dapat diproses.";
    return NextResponse.json(
      {
        message:
          message.includes("Layanan") || message.includes("kunci")
            ? message
            : "Layanan analisis belum aktif. Hubungi admin platform atau ulangi setelah layanan inti berjalan."
      },
      { status: 503 }
    );
  }
}
