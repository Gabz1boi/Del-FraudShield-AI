import { NextResponse } from "next/server";
import { registerOrGetUser } from "@/lib/userRegistration";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string };
    const name = body.name?.trim().replace(/\s+/g, " ") || "";
    const email = body.email?.trim().toLowerCase() || "";

    if (name.length < 3) {
      return NextResponse.json({ message: "Nama pengguna minimal 3 karakter." }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ message: "Format email belum valid." }, { status: 400 });
    }

    const user = await registerOrGetUser(name, email);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_new: user.is_new
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Identitas pengguna belum dapat diproses.";

    const lower = message.toLowerCase();
    const duplicate =
      lower.includes("sudah digunakan") ||
      lower.includes("already exists") ||
      lower.includes("unique constraint");

    return NextResponse.json(
      {
        message: duplicate
          ? "Nama pengguna sudah digunakan oleh akun lain. Gunakan nama yang berbeda."
          : message
      },
      { status: duplicate ? 409 : 503 }
    );
  }
}