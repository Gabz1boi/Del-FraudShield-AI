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
    const result = await callPythonBackend("/admin/metrics");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin metrics unavailable", error);
    return NextResponse.json({ message: "Metrik admin belum dapat dimuat." }, { status: 503 });
  }
}
