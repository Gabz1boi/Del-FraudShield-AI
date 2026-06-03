import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PYTHON_BACKEND_URL } from "@/lib/backendClient";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const incoming = await request.formData();
    const image = incoming.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ message: "File screenshot belum ditemukan." }, { status: 400 });
    }

    const form = new FormData();
    form.append("image", image);
    form.append("user_email", session?.user?.email ?? "");
    form.append("context", String(incoming.get("context") ?? ""));

    const latitude = incoming.get("latitude");
    const longitude = incoming.get("longitude");
    const city = incoming.get("city");
    if (latitude) form.append("latitude", String(latitude));
    if (longitude) form.append("longitude", String(longitude));
    if (city) form.append("city", String(city));

    const response = await fetch(`${PYTHON_BACKEND_URL}/analyze-image-upload`, {
      method: "POST",
      body: form,
      cache: "no-store"
    });

    const text = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text || "Analisis screenshot gagal." };
    }

    if (!response.ok) {
      const detail = typeof payload === "object" && payload && "detail" in payload ? (payload as { detail?: string }).detail : undefined;
      return NextResponse.json({ message: detail || "Screenshot belum dapat dianalisis saat ini." }, { status: response.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Image analysis unavailable", error);
    return NextResponse.json(
      { message: "Layanan pembacaan screenshot belum aktif. Pastikan konfigurasi AI dan layanan inti sudah siap." },
      { status: 503 }
    );
  }
}
