import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Endpoint draft laporan dinonaktifkan. Platform ini bukan wadah pelaporan; gunakan /api/services/nearest untuk mencari rujukan layanan/lembaga yang relevan."
    },
    { status: 410 }
  );
}
