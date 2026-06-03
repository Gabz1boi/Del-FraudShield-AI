import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callPythonBackend } from "@/lib/backendClient";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      latitude?: number | null;
      longitude?: number | null;
      city?: string | null;
    };

    if (!body.message || body.message.trim().length < 3) {
      return NextResponse.json({ message: "Pesan terlalu pendek." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const result = await callPythonBackend("/chat", {
      method: "POST",
      body: JSON.stringify({
        message: body.message,
        user_email: session?.user?.email ?? null,
        latitude: typeof body.latitude === "number" ? body.latitude : null,
        longitude: typeof body.longitude === "number" ? body.longitude : null,
        city: body.city ?? null
      })
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI chatbot unavailable", error);
    const message = error instanceof Error ? error.message : "Asisten belum dapat memproses pesan.";
    return NextResponse.json(
      { message: message || "Asisten keamanan belum aktif. Hubungi admin platform." },
      { status: 503 }
    );
  }
}
