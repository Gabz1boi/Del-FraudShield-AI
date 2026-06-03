import type { RiskLevel } from "@/lib/fraudEngine";

const map: Record<RiskLevel, string> = {
  Rendah: "bg-emerald-400/12 text-emerald-100 ring-emerald-300/20",
  Sedang: "bg-amber-400/12 text-amber-100 ring-amber-300/20",
  Tinggi: "bg-red-400/12 text-red-100 ring-red-300/20"
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${map[level]}`}>
      Risiko {level}
    </span>
  );
}
