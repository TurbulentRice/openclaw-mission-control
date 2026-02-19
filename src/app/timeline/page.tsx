import { AppShell } from "@/components/layout/app-shell";

export default function TimelinePage() {
  return (
    <AppShell>
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-semibold">Timeline</h2>
        <p className="mt-2 text-sm text-slate-400">
          Timeline module placeholder. Next step: ingest mission events + cron run outcomes.
        </p>
      </section>
    </AppShell>
  );
}
