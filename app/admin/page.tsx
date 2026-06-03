"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useEffect, useState } from "react";

type AnalysisItem = {
  id: number;
  created_at: string;
  input_type: string;
  title: string;
  score: number;
  level: string;
  user_email?: string | null;
};

type AdminMetrics = {
  total_analyses: number;
  total_chats: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  average_score: number;
  recent_analyses: AnalysisItem[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/metrics", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Metrik admin belum tersedia.");
      setMetrics(null);
    } else {
      setMetrics(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMetrics();
    const timer = window.setInterval(loadMetrics, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const cards = metrics
    ? [
        ["Total analisis", metrics.total_analyses],
        ["Chatbot", metrics.total_chats],
        ["Risiko tinggi", metrics.high_risk_count],
        ["Rata-rata skor", `${metrics.average_score}%`]
      ]
    : [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin Monitor"
        title="Pantau aktivitas deteksi dan chatbot secara real-time."
        description="Halaman ini membaca database backend Python. Data diperbarui otomatis setiap 15 detik agar admin dapat memantau log analisis terbaru."
      />

      {error && (
        <div className="mb-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
          <p className="font-bold text-white">Backend belum aktif</p>
          <p className="mt-2">{error}</p>
          <p className="mt-2">
            Jalankan <code className="rounded bg-slate-950/60 px-2 py-1">uvicorn app.main:app --reload --app-dir backend</code>, lalu refresh halaman ini.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !metrics
          ? ["Memuat", "Memuat", "Memuat", "Memuat"].map((label, index) => (
              <div key={`${label}-${index}`} className="glass-panel rounded-3xl p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-3xl font-black text-white">...</p>
              </div>
            ))
          : cards.map(([label, value]) => (
              <div key={label} className="glass-panel rounded-3xl p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
      </div>

      {metrics && (
        <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="glass-panel rounded-3xl p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Distribusi Risiko</p>
            <h2 className="mt-2 text-2xl font-black text-white">Komposisi level</h2>
            <div className="mt-5 space-y-4">
              {[
                ["Tinggi", metrics.high_risk_count],
                ["Sedang", metrics.medium_risk_count],
                ["Rendah", metrics.low_risk_count]
              ].map(([label, value]) => {
                const total = Math.max(metrics.total_analyses, 1);
                const width = `${Math.round((Number(value) / total) * 100)}%`;
                return (
                  <div key={label as string}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-300">{label}</span>
                      <span className="font-bold text-white">{value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/8">
                      <div className="h-3 rounded-full bg-cyan-300" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Recent Logs</p>
                <h2 className="mt-2 text-2xl font-black text-white">Analisis terbaru</h2>
              </div>
              <button onClick={loadMetrics} className="secondary-button px-5 py-2 text-sm">
                Refresh
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="pb-3">Waktu</th>
                    <th className="pb-3">Tipe</th>
                    <th className="pb-3">Judul</th>
                    <th className="pb-3">Skor</th>
                    <th className="pb-3">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-300">
                  {metrics.recent_analyses.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3">{formatTime(item.created_at)}</td>
                      <td className="py-3 uppercase">{item.input_type}</td>
                      <td className="py-3 text-white">{item.title}</td>
                      <td className="py-3 font-bold text-white">{item.score}%</td>
                      <td className="py-3">{item.level}</td>
                    </tr>
                  ))}
                  {metrics.recent_analyses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Belum ada log. Coba jalankan URL checker atau chatbot terlebih dahulu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
