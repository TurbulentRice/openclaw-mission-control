"use client";

import { useEffect, useMemo, useState } from "react";
import type { TimelineEvent, TimelineEventKind, TimelineEventSource, TimelineSourceStatus } from "@/lib/timeline/types";

interface TimelineResponse {
  ok: boolean;
  events: TimelineEvent[];
  generatedAtMs: number;
  warnings: string[];
  sources: Record<string, TimelineSourceStatus>;
}

const sourceOptions: Array<TimelineEventSource | "all"> = ["all", "openclaw", "mission_control", "memory"];
const kindOptions: Array<TimelineEventKind | "all"> = [
  "all",
  "cron_run",
  "cron_scheduled",
  "task_update",
  "calendar_item",
  "memory_update",
];

function startOfLocalDay(ms: number) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function bucketLabel(ts: number) {
  const todayStart = startOfLocalDay(Date.now());
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  if (ts >= todayStart && ts < tomorrowStart) return "Today";
  if (ts >= tomorrowStart) return "Upcoming";
  return "Past";
}

function severityStyle(severity: TimelineEvent["severity"]) {
  switch (severity) {
    case "success":
      return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
    case "warning":
      return "border-amber-300/30 bg-amber-400/10 text-amber-100";
    case "error":
      return "border-rose-300/30 bg-rose-400/10 text-rose-100";
    default:
      return "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";
  }
}

function sourceStatusStyle(state: TimelineSourceStatus) {
  if (state === "ok") return "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
  if (state === "degraded") return "border-amber-300/30 bg-amber-400/10 text-amber-200";
  if (state === "timeout") return "border-amber-300/30 bg-amber-500/10 text-amber-100";
  if (state === "denied") return "border-rose-300/30 bg-rose-500/10 text-rose-100";
  return "border-rose-300/30 bg-rose-400/10 text-rose-200";
}

function extractDetail(event: TimelineEvent) {
  const metadata = event.metadata;
  if (!metadata) return null;

  const detailCandidates = ["lastError", "error", "message", "detail", "details", "reason", "status", "preview"];
  for (const key of detailCandidates) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

export function TimelineBoard() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sources, setSources] = useState<Record<string, TimelineSourceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<TimelineEventSource | "all">("all");
  const [kindFilter, setKindFilter] = useState<TimelineEventKind | "all">("all");

  async function load() {
    const res = await fetch("/api/timeline?limit=400", { cache: "no-store" });
    const json = (await res.json()) as TimelineResponse;
    if (json.ok) {
      setEvents(json.events ?? []);
      setWarnings(json.warnings ?? []);
      setSources(json.sources ?? {});
    }
    setLoading(false);
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
    const i = setInterval(() => void load(), 30_000);
    return () => clearInterval(i);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (sourceFilter !== "all" && event.source !== sourceFilter) return false;
      if (kindFilter !== "all" && event.kind !== kindFilter) return false;
      if (!q) return true;

      const searchable = `${event.title} ${event.summary} ${event.tags.join(" ")}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [events, query, sourceFilter, kindFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const event of filtered) {
      const label = bucketLabel(event.ts);
      const current = map.get(label) ?? [];
      current.push(event);
      map.set(label, current);
    }

    const order = ["Today", "Upcoming", "Past"];
    return order.filter((label) => map.has(label)).map((label) => [label, map.get(label) ?? []] as const);
  }, [filtered]);

  return (
    <section className="flex h-[calc(100vh-3rem)] min-h-0 flex-col gap-4">
      <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
        <h2 className="text-2xl font-semibold">Timeline</h2>
        <p className="mt-1 text-sm text-slate-300">Running history across OpenClaw cron activity, Mission Control updates, and memory changes.</p>

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search timeline..."
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none ring-cyan-300/40 focus:ring"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as TimelineEventSource | "all")}
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
          >
            {sourceOptions.map((source) => (
              <option key={source} value={source}>{source === "all" ? "All sources" : source}</option>
            ))}
          </select>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as TimelineEventKind | "all")}
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
          >
            {kindOptions.map((kind) => (
              <option key={kind} value={kind}>{kind === "all" ? "All event types" : kind}</option>
            ))}
          </select>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
            {filtered.length} events
          </div>
        </div>
      </article>

      <article className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {Object.entries(sources).map(([key, state]) => (
            <span
              key={key}
              className={`rounded border px-2 py-1 ${sourceStatusStyle(state)}`}
            >
              {key}: {state}
            </span>
          ))}
        </div>

        {warnings.length > 0 ? (
          <div className="mb-4 rounded-lg border border-amber-300/30 bg-amber-500/10 p-3 text-xs text-amber-100">
            {warnings.map((warning) => (
              <p key={warning}>• {warning}</p>
            ))}
          </div>
        ) : null}

        {loading ? <p className="text-sm text-slate-400">Loading timeline…</p> : null}

        {!loading && filtered.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-400">No events match your filters yet.</p>
        ) : null}

        <div className="min-h-0 flex-1 space-y-5 overflow-auto pr-1">
          {grouped.map(([label, entries]) => (
            <section key={label}>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <div className="space-y-2">
                {entries.map((event) => {
                  const detailText = extractDetail(event);
                  return (
                    <article key={event.id} className="rounded-xl border border-white/10 bg-[#101a2d] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-100">{event.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${severityStyle(event.severity)}`}>{event.severity}</span>
                          <span className="text-xs text-slate-400">{new Date(event.ts).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{event.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.tags.slice(0, 6).map((tag) => (
                          <span key={tag} className="rounded border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-slate-300">#{tag}</span>
                        ))}
                      </div>

                      {event.metadata ? (
                        <details className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2">
                          <summary className="cursor-pointer text-xs font-medium text-cyan-200">View details</summary>
                          {detailText ? (
                            <p className="mt-2 whitespace-pre-wrap break-words rounded border border-rose-300/25 bg-rose-500/10 p-2 text-xs text-rose-100">
                              {detailText}
                            </p>
                          ) : null}
                          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}
