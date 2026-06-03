"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ResultPanel } from "@/components/ResultPanel";
import type { AnalysisType, FraudAnalysisResult } from "@/lib/fraudEngine";
import { ChangeEvent, useEffect, useRef, useState } from "react";

const textExample = "Selamat, Anda menerima bantuan beasiswa. Segera klik link berikut dan kirim OTP agar dana tidak hangus hari ini.";

type BrowserLocation = { latitude: number; longitude: number } | null;

function requestLocation(): Promise<BrowserLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });
}

export default function AnalyzerPage() {
  const [mode, setMode] = useState<Extract<AnalysisType, "text" | "image">>("text");
  const [content, setContent] = useState(textExample);
  const [imageContext, setImageContext] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<FraudAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendLocation, setSendLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function changeMode(nextMode: Extract<AnalysisType, "text" | "image">) {
    setMode(nextMode);
    setResult(null);
    setError("");
    if (nextMode === "text") {
      setContent(textExample);
    } else {
      setContent("");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");

    // Memungkinkan pengguna memilih ulang file yang sama atau menggantinya tanpa browser menahan value lama.
    event.target.value = "";
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    setImageContext("");
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function analyze() {
    setLoading(true);
    setResult(null);
    setError("");

    const location = sendLocation ? await requestLocation() : null;

    let response: Response;
    if (mode === "image") {
      if (!selectedFile && imageContext.trim().length < 5) {
        setError("Unggah screenshot atau isi konteks singkat agar analisis dapat dilakukan.");
        setLoading(false);
        return;
      }

      if (selectedFile) {
        const form = new FormData();
        form.append("image", selectedFile);
        form.append("context", imageContext);
        if (typeof location?.latitude === "number") form.append("latitude", String(location.latitude));
        if (typeof location?.longitude === "number") form.append("longitude", String(location.longitude));
        response = await fetch("/api/analyze-image", { method: "POST", body: form });
      } else {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "image", content: imageContext, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null })
        });
      }
    } else {
      response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, content, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null })
      });
    }

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Analisis belum dapat diproses.");
    } else {
      setResult(data);
    }
    setLoading(false);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Analisis Pesan"
        title="Baca pola manipulasi pada chat, SMS, dan screenshot."
        description="Masukkan teks pesan atau unggah screenshot percakapan. Sistem akan membantu menilai apakah pesan mengandung tekanan, permintaan data sensitif, tautan mencurigakan, transfer, ancaman, atau pola penipuan lain."
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-3xl p-6">
          <div className="mb-5 flex rounded-2xl bg-white/6 p-1">
            <button
              onClick={() => changeMode("text")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${mode === "text" ? "bg-cyan-300/14 text-cyan-100" : "text-slate-300"}`}
            >
              Analisis Teks
            </button>
            <button
              onClick={() => changeMode("image")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${mode === "image" ? "bg-cyan-300/14 text-cyan-100" : "text-slate-300"}`}
            >
              Screenshot
            </button>
          </div>

          {mode === "image" ? (
            <>
              <label className="mb-4 block rounded-2xl border border-dashed border-cyan-200/24 bg-cyan-200/5 p-5 text-center">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <span className="block text-sm font-bold text-white">
                  {selectedFile ? selectedFile.name : "Klik untuk memilih screenshot"}
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-400">
                  Screenshot akan dibaca langsung oleh sistem. Keterangan tambahan di bawah ini opsional.
                </span>
              </label>

              {previewUrl && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <img src={previewUrl} alt="Preview screenshot" className="max-h-72 w-full rounded-xl object-contain" />
                  <button onClick={clearImage} className="secondary-button mt-3 px-5 py-2 text-sm">
                    Ganti / hapus screenshot
                  </button>
                </div>
              )}

              <label className="block">
                <span className="mb-3 block text-sm font-bold text-white">Keterangan tambahan opsional</span>
                <textarea
                  className="input-field min-h-32 resize-none"
                  value={imageContext}
                  onChange={(event) => setImageContext(event.target.value)}
                  placeholder="Contoh: Pesan ini dikirim oleh nomor tidak dikenal dan meminta biaya admin. Boleh dikosongkan bila screenshot sudah jelas."
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-3 block text-sm font-bold text-white">Isi chat, SMS, atau email</span>
              <textarea
                className="input-field min-h-52 resize-none"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </label>
          )}

          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={sendLocation}
              onChange={(event) => setSendLocation(event.target.checked)}
              className="mt-1"
            />
            <span>Sertakan lokasi secara opsional untuk membantu rujukan bantuan dan pemetaan internal.</span>
          </label>

          {error && <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{error}</div>}

          <button onClick={analyze} disabled={loading} className="primary-button mt-5 w-full">
            {loading ? "Menganalisis..." : "Analisis Sekarang"}
          </button>
        </section>

        <ResultPanel result={result} />
      </div>
    </AppShell>
  );
}
