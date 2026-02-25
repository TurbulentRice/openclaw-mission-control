import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { CopyButton } from "@/components/ui/copy-button";
import { listTasks } from "@/lib/tasks/store";
import { listCalendarItems } from "@/lib/calendar/store";
import { listMemoryDocs } from "@/lib/memory/store";

const templatePrompt = `You are my OpenClaw bot working with Mission Control at http://localhost:3000.

Operating loop (every heartbeat):
1) GET http://localhost:3000/api/tasks (cache: no-store)
2) Pick tasks where owner=\"agent\" and status in [\"selected\", \"doing\", \"blocked\"]
3) Execute next task and post progress by PATCH http://localhost:3000/api/tasks/:id

Handoff workflow:
- When starting work: set status=\"doing\", active=true
- Add implementation notes/decisions in comments[]
- If waiting on me: set status=\"blocked\" with clear unblock request
- When completed: set status=\"done\", active=false, include final summary comment
- If reassignment needed: set owner=\"operator\" and describe the handoff in comments[]`;

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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-medium">Connect OpenClaw Bot → Mission Control</h3>
            <CopyButton text={templatePrompt} label="Copy template prompt" />
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-200">
            <li>Run Mission Control locally: <code className="rounded bg-black/30 px-1 py-0.5">npm run dev</code></li>
            <li>Confirm app is reachable at <code className="rounded bg-black/30 px-1 py-0.5">http://localhost:3000</code></li>
            <li>Paste the template prompt into your OpenClaw bot/system instructions</li>
            <li>Use heartbeat cadence (15–30s) to poll <code className="rounded bg-black/30 px-1 py-0.5">GET /api/tasks</code></li>
            <li>Update task state via <code className="rounded bg-black/30 px-1 py-0.5">PATCH /api/tasks/:id</code> for every handoff</li>
          </ol>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-medium">Handoff Rules</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• <span className="text-slate-100">selected → doing</span> when agent begins work</li>
            <li>• Set <span className="text-slate-100">active=true</span> on in-flight work</li>
            <li>• Append progress notes to <span className="text-slate-100">comments[]</span> on each checkpoint</li>
            <li>• Use <span className="text-slate-100">blocked</span> with explicit unblock request</li>
            <li>• On completion, set <span className="text-slate-100">done</span> + final summary comment</li>
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-lg font-medium">Template Prompt</h3>
          <CopyButton text={templatePrompt} />
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-slate-200">
          <code>{templatePrompt}</code>
        </pre>
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
    </AppShell>
  );
}
