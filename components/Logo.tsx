export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 soft-border shadow-glow">
        <div className="absolute h-6 w-6 rounded-full border border-cyan-200/40" />
        <div className="h-2.5 w-2.5 rounded-full bg-cyanSoft shadow-[0_0_22px_rgba(103,232,249,0.95)]" />
      </div>
      <div>
        <p className="text-base font-black tracking-tight text-white">Del-FraudShield AI</p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">MarBisuk Digital Shield</p>
      </div>
    </div>
  );
}
