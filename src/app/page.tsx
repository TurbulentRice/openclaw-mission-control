import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import Link from "next/link";
import { openclawRequest } from "@/lib/openclaw/client";

async function getStatus() {
  try {
    await openclawRequest({ path: "/status" });
    return true;
  } catch {
    return false;
  }
}

export default async function Home() {
  const connected = await getStatus();
  const statusText = connected ? "Connected" : "Offline";

  return (
    <AppShell>
      <header className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Foundation</p>
        <h2 className="mt-1 text-3xl font-semibold">Mission Control</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Control-plane foundation ready. OpenClaw data stays source-of-truth via direct API, while
          Convex stores app-specific organizational layers (tasks, annotations, intent).
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="OpenClaw Link" value={statusText} hint="/api/openclaw/status" />
        <KpiCard label="Runtime Mode" value="localhost" hint="middleware-enforced" />
        <KpiCard label="Data Plane" value="OpenClaw API" hint="source of truth" />
        <KpiCard label="App Plane" value="Convex" hint="tasks/events/extensions" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">Operator Shortcuts</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/tasks" className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">
              Open Task Board
            </Link>
            <Link href="/calendar" className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">
              Open Calendar
            </Link>
            <Link href="/timeline" className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">
              Open Timeline
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">What’s scaffolded</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Localhost-only access guard (proxy)</li>
            <li>OpenClaw status proxy route and typed client</li>
            <li>Task board with assignment + status lifecycle</li>
            <li>Convex schema for upcoming app-domain expansion</li>
            <li>Delight-focused shell layout + architecture docs</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">Next feature slices</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Proactive event timeline + severity filters</li>
            <li>Cron mission planner with “why this exists” metadata</li>
            <li>Digest-to-task extraction automation</li>
            <li>Intervention console with audit trails</li>
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
