import type { FraudAnalysisResult } from "@/lib/fraudEngine";
import { RiskBadge } from "@/components/RiskBadge";

function readableCategory(category?: string) {
  if (!category) return "-";
  return category.replaceAll("_", " ");
}

function renderFeatureValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

export function ResultPanel({ result }: { result: FraudAnalysisResult | null }) {
  if (!result) {
    return (
      <div className="glass-panel rounded-3xl p-6">
        <p className="text-sm font-semibold text-white">Hasil deteksi akan tampil di sini.</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Masukkan URL, teks chat, atau data screenshot. Sistem akan memberi skor risiko,
          alasan deteksi, rekomendasi tindakan, dan status sumber eksternal bila tersedia.
        </p>
      </div>
    );
  }

  const compactFeatures = Object.entries(result.features || {}).filter(([key, value]) => {
    if (key === "threatIntel") return false;
    return ["string", "number", "boolean"].includes(typeof value);
  });

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/50">Hasil Analisis</p>
          <h2 className="mt-2 text-2xl font-black text-white">{result.title}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Kategori: <span className="text-slate-200">{readableCategory(result.case_category)}</span>
            {result.external_source ? ` · Sumber eksternal: ${result.external_source}` : ""}
          </p>
        </div>
        <RiskBadge level={result.level} />
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between">
          <span className="text-sm text-slate-300">Skor risiko</span>
          <span className="text-3xl font-black text-white">{result.score}%</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white/8">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-cyan-300 via-amber-300 to-red-400"
            style={{ width: `${Math.min(result.score, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="font-bold text-white">Alasan deteksi</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {result.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="font-bold text-white">Rekomendasi</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {result.recommendations.map((recommendation) => (
              <li key={recommendation}>• {recommendation}</li>
            ))}
          </ul>
        </div>
      </div>

      {compactFeatures.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="font-bold text-white">Fitur yang terbaca</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {compactFeatures.slice(0, 12).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-slate-950/35 p-3 text-xs">
                <p className="text-slate-500">{key}</p>
                <p className="mt-1 truncate font-semibold text-slate-200">{renderFeatureValue(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
