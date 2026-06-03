import { LoginPanel } from "@/components/LoginPanel";
import { PublicNav } from "@/components/PublicNav";

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <>
      <PublicNav />
      <main className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-100/55">Secure Gate</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
            Masuk ke ruang analisis Del-FraudShield AI.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Setiap pengguna memiliki akun dan riwayat sendiri. Nama pengguna dibuat unik agar aktivitas analisis, chat, dan rujukan bantuan tidak tercampur dengan akun lain.
          </p>
        </section>
        <LoginPanel googleEnabled={googleEnabled} />
      </main>
    </>
  );
}
