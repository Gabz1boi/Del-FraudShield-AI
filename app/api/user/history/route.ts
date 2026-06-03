import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callPythonBackend } from "@/lib/backendClient";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ message: "Sesi pengguna tidak ditemukan." }, { status: 401 });
    }

    const params = new URLSearchParams({ email });
    const result = await callPythonBackend(`/users/history?${params.toString()}`, { method: "GET" });
    return NextResponse.json(result);
  } catch (error) {
    console.error("User history unavailable", error);
    return NextResponse.json(
      { message: "Riwayat pribadi belum dapat dimuat. Pastikan layanan inti sudah berjalan." },
      { status: 503 }
    );
  }
}
