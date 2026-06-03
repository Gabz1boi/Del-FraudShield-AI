"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ResultPanel } from "@/components/ResultPanel";
import type { FraudAnalysisResult } from "@/lib/fraudEngine";
import { useState } from "react";

type BrowserLocation = { latitude: number; longitude: number } | null;

function requestLocation(): Promise<BrowserLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });
}

function getThreatIntel(result: FraudAnalysisResult | null) {
  const intel = result?.features?.threatIntel;
  if (!intel || typeof intel !== "object") return null;
  return intel as {
    source?: string;
    status?: string;
    stats?: Record<string, number>;
    permalink?: string;
    flaggedEngines?: Array<{ engine: string; category: string; result: string }>;
  };
}

export default function CheckerPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<FraudAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendLocation, setSendLocation] = useState(false);

  async function analyze() {
    setLoading(true);
    setResult(null);
    setError("");

    const location = sendLocation ? await requestLocation() : null;
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "url",
        content: url,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Link belum dapat diperiksa saat ini.");
    } else {
      setResult(data);
    }
    setLoading(false);
  }

  const threatIntel = getThreatIntel(result);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Cek Link"
        title="Cek keamanan tautan sebelum dibuka."
        description="Tempelkan link yang Anda terima. Sistem akan membaca pola alamat, tanda penyamaran, kata berisiko, dan reputasi keamanan dari sumber eksternal agar Anda mendapat gambaran risiko sebelum mengeklik."
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <label className="block">
            <span className="mb-3 block text-sm font-bold text-white">Tempel link yang ingin diperiksa</span>
            <textarea
              className="input-field min-h-36 resize-none"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Contoh: https://contoh-link-mencurigakan.com/login"
            />
          </label>

          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={sendLocation}
              onChange={(event) => setSendLocation(event.target.checked)}
              className="mt-1"
            />
            <span>
              Sertakan lokasi secara opsional agar riwayat risiko dapat dipetakan lebih akurat dan rekomendasi bantuan bisa lebih relevan.
            </span>
          </label>

          {error && (
            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              {error}
            </div>
          )}

          <button onClick={analyze} disabled={loading} className="primary-button mt-5 w-full">
            {loading ? "Memeriksa reputasi link..." : "Cek Link Sekarang"}
          </button>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            <p className="font-bold text-white">Cara membaca hasil</p>
            <p className="mt-2">
              Skor rendah bukan berarti pasti aman, tetapi menunjukkan sinyal mencurigakan belum kuat. Skor tinggi berarti link memuat tanda yang perlu diwaspadai, misalnya domain tiruan, pemendek URL, permintaan login, atau reputasi buruk dari pemeriksa keamanan.
            </p>
          </div>

          {threatIntel && (
            <div className="mt-4 rounded-2xl border border-cyan-200/10 bg-cyan-200/5 p-4 text-sm leading-6 text-slate-300">
              <p className="font-bold text-white">Reputasi keamanan eksternal</p>
              <p className="mt-2">Status pemeriksaan: {threatIntel.status || "-"}</p>
              {threatIntel.stats && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(threatIntel.stats).map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-slate-950/40 p-3">
                      <p className="text-xs capitalize text-slate-400">{key}</p>
                      <p className="text-lg font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}
              {threatIntel.permalink && (
                <a className="mt-3 inline-block text-cyan-100 underline" href={threatIntel.permalink} target="_blank" rel="noreferrer">
                  Lihat laporan sumber eksternal
                </a>
              )}
            </div>
          )}
        </section>

        <ResultPanel result={result} />
      </div>
    </AppShell>
  );
}
