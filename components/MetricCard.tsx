export function MetricCard({
  label,
  value,
  note,
  tone = "cyan"
}: {
  label: string;
  value: string;
  note: string;
  tone?: "cyan" | "green" | "yellow" | "red";
}) {
  const toneMap = {
    cyan: "from-cyan-300/18 to-blue-500/8 text-cyan-100",
    green: "from-emerald-300/16 to-teal-500/8 text-emerald-100",
    yellow: "from-amber-300/16 to-orange-500/8 text-amber-100",
    red: "from-red-300/16 to-rose-500/8 text-red-100"
  };

  return (
    <div className={`glass-panel rounded-3xl bg-gradient-to-br p-5 ${toneMap[tone]}`}>
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{note}</p>
    </div>
  );
}
