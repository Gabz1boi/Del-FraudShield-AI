"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type AnalysisItem = {
  id: number;
  created_at: string;
  input_type: string;
  title: string;
  score: number;
  level: string;
  case_category?: string | null;
};

type ChatItem = {
  id: number;
  created_at: string;
  message: string;
  reply: string;
  risk_score: number;
  risk_level: string;
  case_category?: string | null;
};

type UserHistory = {
  user_email: string;
  total_analyses: number;
  total_chats: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  average_score: number;
  recent_analyses: AnalysisItem[];
  recent_chats: ChatItem[];
};

const educationCards = [
  {
    title: "Jangan pernah kirim OTP",
    body: "Kode OTP, PIN, password, dan token verifikasi adalah kunci akun. Petugas resmi tidak akan meminta kode itu melalui chat pribadi."
  },
  {
    title: "Periksa domain sebelum klik",
    body: "Penipu sering memakai nama institusi, hadiah, beasiswa, atau paket pengiriman. Buka situs resmi dengan mengetik alamatnya sendiri."
  },
  {
    title: "Simpan bukti sebelum melapor",
    body: "Screenshot, URL, nomor pengirim, nomor rekening, waktu kejadian, dan kronologi singkat akan membantu proses bantuan berikutnya."
  }
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function readableCategory(category?: string | null) {
  return category ? category.replaceAll("_", " ") : "umum";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/user/history", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Riwayat pribadi belum tersedia.");
      setHistory(null);
    } else {
      setHistory(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const timer = window.setInterval(loadData, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const cards = [
    { label: "Analisis saya", value: history?.total_analyses ?? 0 },
    { label: "Chat bantuan", value: history?.total_chats ?? 0 },
    { label: "Risiko tinggi", value: history?.high_risk_count ?? 0 },
    { label: "Rata-rata skor", value: `${history?.average_score ?? 0}%` }
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard Pribadi"
        title={`Halo, ${session?.user?.name ?? "Pengguna"}`}
        description="Dashboard ini menampilkan edukasi pencegahan dan riwayat penggunaan milik akun Anda sendiri. Setiap pengguna memiliki ringkasan berbeda berdasarkan aktivitas masing-masing."
      />

      {error && (
        <div className="mb-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
          <p className="font-bold text-white">Riwayat belum dapat dimuat</p>
          <p className="mt-2">{error}</p>
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-3xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Edukasi Singkat</p>
          <h2 className="mt-2 text-2xl font-black text-white">Hal penting sebelum merespons pesan mencurigakan</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {educationCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="font-bold text-white">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Akses Cepat</p>
          <h2 className="mt-2 text-2xl font-black text-white">Mulai pemeriksaan</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/checker" className="secondary-button text-center">Cek link mencurigakan</Link>
            <Link href="/analyzer" className="secondary-button text-center">Analisis chat/screenshot</Link>
            <Link href="/chatbot" className="secondary-button text-center">Tanya asisten keamanan</Link>
            <Link href="/report" className="secondary-button text-center">Cari rujukan bantuan</Link>
          </div>
        </div>
      </section>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-panel rounded-3xl p-5">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-black text-white">{loading && !history ? "..." : card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Riwayat Penggunaan</p>
              <h2 className="mt-2 text-2xl font-black text-white">Analisis terbaru saya</h2>
            </div>
            <button onClick={loadData} className="secondary-button px-5 py-2 text-sm">Perbarui</button>
          </div>

          <div className="mt-5 space-y-3">
            {history?.recent_analyses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{formatTime(item.created_at)} · {item.input_type.toUpperCase()}</span>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{item.score}% · {item.level}</span>
                </div>
                <p className="mt-2 font-semibold leading-6 text-white">{item.title}</p>
                <p className="mt-1 text-sm capitalize text-slate-400">{readableCategory(item.case_category)}</p>
              </div>
            ))}
            {history && history.recent_analyses.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-400">
                Belum ada analisis. Mulai dari fitur cek link atau analisis pesan.
              </p>
            )}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Riwayat Chat</p>
          <h2 className="mt-2 text-2xl font-black text-white">Percakapan bantuan terbaru</h2>
          <div className="mt-5 space-y-3">
            {history?.recent_chats.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{formatTime(item.created_at)}</span>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{item.risk_score}% · {item.risk_level}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{item.message}</p>
              </div>
            ))}
            {history && history.recent_chats.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-400">
                Belum ada percakapan. Anda dapat bertanya ke asisten keamanan kapan saja.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
