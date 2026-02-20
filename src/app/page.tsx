import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { listTasks } from "@/lib/tasks/store";
import { listCalendarItems } from "@/lib/calendar/store";
import { listMemoryDocs } from "@/lib/memory/store";

async function getOverviewData() {
  const [tasks, calendarItems, memoryDocs] = await Promise.all([
    listTasks(),
    listCalendarItems(),
    listMemoryDocs(),
  ]);

  const doingCount = tasks.filter((t) => t.status === "doing").length;
  const blockedCount = tasks.filter((t) => t.status === "blocked").length;
  const selectedCount = tasks.filter((t) => t.status === "selected").length;

  return {
    tasks,
    calendarItems,
    memoryDocs,
    doingCount,
    blockedCount,
    selectedCount,
  };
}

export default async function Home() {
  const {
    tasks,
    calendarItems,
    memoryDocs,
    doingCount,
    blockedCount,
    selectedCount,
  } = await getOverviewData();

  return (
    <AppShell>
      <header className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Overview</p>
        <h2 className="mt-1 text-3xl font-semibold">Mission Control</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Live command snapshot for your operator workflow. Check connection health,
          task throughput, scheduling load, and jump straight into action.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Tasks" value={String(doingCount)} hint={`${selectedCount} selected · ${blockedCount} blocked`} />
        <KpiCard label="Scheduled Items" value={String(calendarItems.length)} hint="calendar tasks" />
        <KpiCard label="Memory Docs" value={String(memoryDocs.length)} hint="workspace memory corpus" />
        <KpiCard label="Runtime" value="Localhost" hint="fast local-first dashboard" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">Quick Actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/tasks" className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">
              Open Tasks
            </Link>
            <Link href="/calendar" className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">
              Open Calendar
            </Link>
            <Link href="/memory" className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">
              Browse Memory
            </Link>
            <Link href="/settings" className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">
              App Settings
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">Queue Health</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Total tasks: {tasks.length}</li>
            <li>• Selected: {selectedCount}</li>
            <li>• Doing: {doingCount}</li>
            <li>• Blocked: {blockedCount}</li>
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">Recent Focus</h3>
          <div className="mt-3 space-y-2">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium text-slate-100">{task.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {task.status} · {task.owner} · updated {new Date(task.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks yet.</p>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">Status Notes</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Localhost-only runtime is active</li>
            <li>OpenClaw API remains the source of truth for bot runtime state</li>
            <li>Mission Control handles planning, tracking, and operator overlays</li>
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
