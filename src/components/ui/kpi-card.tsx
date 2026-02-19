import type { ReactNode } from "react";

export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-cyan-200">{value}</p>
      {hint ? <div className="mt-2 text-xs text-slate-400">{hint}</div> : null}
    </article>
  );
}
