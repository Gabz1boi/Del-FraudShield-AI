import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callPythonBackend } from "@/lib/backendClient";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "Akses admin diperlukan." }, { status: 403 });
    }
    const result = await callPythonBackend("/cases/realtime", { method: "GET" });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Realtime cases unavailable", error);
    return NextResponse.json({ message: "Mapping kasus belum dapat dimuat." }, { status: 503 });
  }
}
