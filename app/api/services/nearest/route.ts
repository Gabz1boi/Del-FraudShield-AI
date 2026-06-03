import { NextResponse } from "next/server";
import { callPythonBackend } from "@/lib/backendClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await callPythonBackend("/services/nearest", {
      method: "POST",
      body: JSON.stringify(body)
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Nearest services unavailable", error);
    return NextResponse.json(
      { message: "Direktori rujukan belum dapat dimuat. Hubungi admin platform atau ulangi beberapa saat lagi." },
      { status: 503 }
    );
  }
}
