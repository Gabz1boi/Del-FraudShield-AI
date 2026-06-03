"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RegisterResponse = {
  message?: string;
  name?: string;
  email?: string;
};

async function readRegisterResponse(response: Response): Promise<RegisterResponse> {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as RegisterResponse;
  } catch {
    return { message: text };
  }
}

export function LoginPanel({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError("Login belum berhasil. Periksa kembali nama pengguna dan email yang Anda gunakan.");
    }
  }, []);

  async function localLogin() {
    setError("");
    const trimmedName = name.trim().replace(/\s+/g, " ");
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 3) {
      setError("Nama pengguna minimal 3 karakter.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Format email belum valid.");
      return;
    }

    setLoading(true);

    try {
      const registerResponse = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
        cache: "no-store"
      });
      const registerData = await readRegisterResponse(registerResponse);

      if (!registerResponse.ok) {
        setError(registerData.message || "Nama pengguna atau email belum dapat digunakan.");
        return;
      }

      const result = await signIn("local-del", {
        name: trimmedName,
        email: trimmedEmail,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (result?.error) {
        setError("Login belum berhasil. Gunakan nama dan email yang sama dengan identitas yang sudah didaftarkan.");
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error("Local login failed", error);
      setError("Login belum dapat diproses. Muat ulang halaman, pastikan server web masih berjalan, lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="rounded-3xl border border-cyan-200/10 bg-slate-950/40 p-5">
        <p className="text-sm font-bold text-cyan-100">Identitas Pengguna</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Gunakan nama pengguna yang unik. Jika nama sudah dipakai akun lain, sistem akan meminta Anda memilih nama berbeda agar riwayat tiap pengguna tetap terpisah.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Nama pengguna</span>
            <input
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Gabriel Situmorang"
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
            {error}
          </div>
        )}

        <button onClick={localLogin} disabled={loading || status === "loading"} className="primary-button mt-5 w-full">
          {loading || status === "loading" ? "Memproses..." : "Masuk ke Platform"}
        </button>

        {googleEnabled && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">atau</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="secondary-button w-full">
              Masuk dengan Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
