import { NextResponse } from "next/server";
import { registerOrGetUser } from "@/lib/userRegistration";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string };
    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";

    if (name.length < 3) {
      return NextResponse.json({ message: "Nama pengguna minimal 3 karakter." }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ message: "Format email belum valid." }, { status: 400 });
    }

    const user = await registerOrGetUser(name, email);
    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Identitas pengguna belum dapat diproses.";
    const lowerMessage = message.toLowerCase();
    const duplicate = lowerMessage.includes("sudah digunakan") || lowerMessage.includes("sudah terdaftar");

    return NextResponse.json({ message }, { status: duplicate ? 409 : 500 });
  }
}
