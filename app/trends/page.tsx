"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useEffect, useState } from "react";

type CategoryStat = {
  category: string;
  count: number;
  high_risk: number;
  average_score: number;
};

type LiveCase = {
  id: number;
  created_at: string;
  title: string;
  case_category: string;
  score: number;
  level: string;
  input_type: string;
  city?: string | null;
  external_source?: string | null;
  external_status?: string | null;
};

type RealtimeCases = {
  total_cases: number;
  high_risk_cases: number;
  categories: CategoryStat[];
  recent_cases: LiveCase[];
  generated_at: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function readableCategory(category: string) {
  return category.replaceAll("_", " ");
}

export default function TrendsPage() {
  const [data, setData] = useState<RealtimeCases | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCases() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/cases/realtime", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message || "Data mapping belum tersedia.");
      setData(null);
    } else {
      setData(payload);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCases();
    const timer = window.setInterval(loadCases, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const maxCases = Math.max(...(data?.categories.map((item) => item.count) || [1]), 1);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Del-Scam Mapping"
        title="Mapping kasus dari database secara real-time."
        description="Halaman ini tidak memakai data statis. Setiap URL yang dicek dan setiap analisis yang masuk ke backend akan tersimpan ke database, lalu diringkas menjadi distribusi kasus dan daftar kejadian terbaru."
      />

      {error && (
        <div className="mb-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
          <p className="font-bold text-white">Backend belum aktif</p>
          <p className="mt-2">{error}</p>
          <p className="mt-2">
            Jalankan <code className="rounded bg-slate-950/60 px-2 py-1">uvicorn app.main:app --reload --app-dir backend</code>, lalu lakukan analisis URL agar data kasus masuk.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-sm text-slate-400">Total kasus masuk</p>
          <p className="mt-3 text-3xl font-black text-white">{loading && !data ? "..." : data?.total_cases ?? 0}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-sm text-slate-400">Risiko tinggi</p>
          <p className="mt-3 text-3xl font-black text-white">{loading && !data ? "..." : data?.high_risk_cases ?? 0}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-sm text-slate-400">Kategori aktif</p>
          <p className="mt-3 text-3xl font-black text-white">{loading && !data ? "..." : data?.categories.length ?? 0}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-sm text-slate-400">Refresh</p>
          <button onClick={loadCases} className="secondary-button mt-3 px-5 py-2 text-sm">Perbarui</button>
        </div>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Distribusi Kasus</p>
          <h2 className="mt-2 text-2xl font-black text-white">Kategori berdasarkan log analisis</h2>

          <div className="mt-6 space-y-5">
            {data?.categories.map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold capitalize text-slate-200">{readableCategory(item.category)}</span>
                  <span className="font-black text-white">{item.count}</span>
                </div>
                <div className="h-4 rounded-full bg-white/8">
                  <div className="h-4 rounded-full bg-gradient-to-r from-cyan-300 to-teal-400" style={{ width: `${(item.count / maxCases) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">Risiko tinggi: {item.high_risk} · Rata-rata skor: {item.average_score}%</p>
              </div>
            ))}
            {data && data.categories.length === 0 && (
              <p className="text-sm leading-6 text-slate-400">Belum ada kasus. Jalankan URL checker atau analyzer terlebih dahulu.</p>
            )}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Kasus Terbaru</p>
          <h2 className="mt-2 text-2xl font-black text-white">Kejadian yang masuk ke database</h2>
          <div className="mt-5 space-y-3">
            {data?.recent_cases.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{formatTime(item.created_at)} · {item.input_type.toUpperCase()}</span>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{item.score}% · {item.level}</span>
                </div>
                <p className="mt-2 font-semibold leading-6 text-white">{item.title}</p>
                <p className="mt-1 text-sm capitalize text-slate-400">
                  {readableCategory(item.case_category)}{item.city ? ` · ${item.city}` : ""}
                  {item.external_source ? ` · ${item.external_source}:${item.external_status || "-"}` : ""}
                </p>
              </div>
            ))}
            {data && data.recent_cases.length === 0 && (
              <p className="text-sm leading-6 text-slate-400">Belum ada kasus terbaru.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
