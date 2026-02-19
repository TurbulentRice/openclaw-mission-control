"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { CalendarItem, CalendarStatus, CronSnapshot } from "@/lib/calendar/types";

const statusOptions: CalendarStatus[] = ["planned", "active", "done", "canceled"];
type CalendarModal = "none" | "create" | "editTask" | "cronDetails";

function toTaskEvent(item: CalendarItem): EventInput {
  const start = new Date(item.scheduledFor);
  const end = new Date(start.getTime() + (item.durationMin ?? 30) * 60_000);
  return {
    id: `task:${item.id}`,
    title: `📌 ${item.title}`,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: false,
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
    extendedProps: { source: "task", item },
  };
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose} role="presentation">
      <article className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b1220] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10">Close</button>
        </div>
        {children}
      </article>
    </div>
  );
}

export function CalendarBoard() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [cron, setCron] = useState<CronSnapshot[]>([]);
  const [cronEvents, setCronEvents] = useState<EventInput[]>([]);
  const [cacheMeta, setCacheMeta] = useState<{ cachedAtMs?: number; stale?: boolean; fallback?: boolean } | null>(null);

  const [modal, setModal] = useState<CalendarModal>("none");
  const [selectedTask, setSelectedTask] = useState<CalendarItem | null>(null);
  const [selectedCron, setSelectedCron] = useState<CronSnapshot | null>(null);

  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<"operator" | "agent">("agent");
  const [status, setStatus] = useState<CalendarStatus>("planned");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch("/api/calendar", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setItems(json.items as CalendarItem[]);
      setCron(json.cron as CronSnapshot[]);
      setCronEvents((json.cronEvents as EventInput[]) ?? []);
      setCacheMeta((json.cache as { cachedAtMs?: number; stale?: boolean; fallback?: boolean }) ?? null);
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
    const i = setInterval(() => void load(), 15000);
    return () => clearInterval(i);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cronMap = useMemo(() => new Map(cron.map((j) => [j.id, j])), [cron]);

  const events = useMemo(() => {
    const taskEvents = items.map(toTaskEvent);
    const normalizedCronEvents = cronEvents.map((e) => {
      const cronId = (e as { cronId?: string }).cronId ?? String(e.id).split(":")[1];
      return {
        ...e,
        allDay: false,
        backgroundColor: "#1d4ed8",
        borderColor: "#1d4ed8",
        extendedProps: { ...(e.extendedProps ?? {}), source: "cron", cronId },
      } as EventInput;
    });
    return [...taskEvents, ...normalizedCronEvents];
  }, [items, cronEvents]);

  function openCreateModal(startISO?: string) {
    if (startISO) setScheduledFor(startISO.slice(0, 16));
    setModal("create");
  }

  async function createItem() {
    if (!title.trim() || !scheduledFor) return;
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), owner, status, scheduledFor: new Date(scheduledFor).toISOString(), durationMin, notes }),
    });
    setTitle("");
    setNotes("");
    setModal("none");
    await load();
  }

  async function saveSelectedTask() {
    if (!selectedTask) return;
    await fetch(`/api/calendar/${selectedTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedTask),
    });
    setModal("none");
    await load();
  }

  async function deleteSelectedTask() {
    if (!selectedTask) return;
    await fetch(`/api/calendar/${selectedTask.id}`, { method: "DELETE" });
    setSelectedTask(null);
    setModal("none");
    await load();
  }

  const onEventClick = (arg: EventClickArg) => {
    const source = arg.event.extendedProps.source as string | undefined;
    if (source === "task") {
      setSelectedTask(arg.event.extendedProps.item as CalendarItem);
      setModal("editTask");
      return;
    }
    if (source === "cron") {
      const cronId = arg.event.extendedProps.cronId as string | undefined;
      setSelectedCron(cronId ? cronMap.get(cronId) ?? null : null);
      setModal("cronDetails");
      return;
    }
    setModal("none");
  };

  const onDateSelect = (arg: DateSelectArg) => openCreateModal(arg.startStr);

  const onEventDrop = async (arg: EventDropArg) => {
    const source = arg.event.extendedProps.source as string | undefined;
    if (source !== "task") return arg.revert();
    const id = arg.event.id.replace("task:", "");
    const start = arg.event.start;
    if (!start) return arg.revert();
    const end = arg.event.end;
    const nextDuration = end ? Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000)) : undefined;
    await fetch(`/api/calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledFor: start.toISOString(), durationMin: nextDuration }),
    });
    await load();
  };

  const onEventResize = async (arg: EventResizeDoneArg) => {
    const source = arg.event.extendedProps.source as string | undefined;
    if (source !== "task") return arg.revert();
    const id = arg.event.id.replace("task:", "");
    const start = arg.event.start;
    const end = arg.event.end;
    if (!start || !end) return arg.revert();
    const nextDuration = Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000));
    await fetch(`/api/calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledFor: start.toISOString(), durationMin: nextDuration }),
    });
    await load();
  };

  return (
    <section className="flex h-[calc(100vh-3rem)] min-h-0 flex-col gap-4">
      <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Calendar</h2>
            <p className="mt-1 text-sm text-slate-300">Unified schedule for mission tasks and OpenClaw cron runs.</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-1 text-xs ${
                cacheMeta?.fallback
                  ? "border-amber-300/40 bg-amber-400/10 text-amber-200"
                  : cacheMeta?.stale
                    ? "border-slate-300/30 bg-slate-300/10 text-slate-200"
                    : "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
              }`}
              title={cacheMeta?.cachedAtMs ? `Cached ${new Date(cacheMeta.cachedAtMs).toLocaleTimeString()}` : "Cache unavailable"}
            >
              {cacheMeta?.fallback ? "cache:fallback" : cacheMeta?.stale ? "cache:stale" : "cache:fresh"}
            </span>
            <button type="button" onClick={() => openCreateModal()} className="rounded-lg bg-cyan-400/20 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/30">
              Create Scheduled Task
            </button>
          </div>
        </div>
      </article>

      <article className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
          initialView="timeGridWeek"
          nowIndicator
          selectable
          selectMirror
          editable
          eventStartEditable
          eventDurationEditable
          slotEventOverlap={false}
          eventOverlap={false}
          select={onDateSelect}
          events={events}
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          eventResize={onEventResize}
          eventAllow={(_dropInfo, draggedEvent) => {
            if (!draggedEvent) return false;
            return (draggedEvent.extendedProps.source as string | undefined) === "task";
          }}
          displayEventTime={false}
          eventDidMount={(info) => {
            const start = info.event.start;
            const end = info.event.end;
            const timeLabel = start
              ? `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${end ? ` - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`
              : "Time n/a";
            info.el.setAttribute("title", `${timeLabel}\n${info.event.title}`);
          }}
          expandRows
          stickyHeaderDates
          scrollTimeReset={false}
          scrollTime={(() => {
            const d = new Date();
            d.setHours(Math.max(0, d.getHours() - 2), 0, 0, 0);
            return `${String(d.getHours()).padStart(2, "0")}:00:00`;
          })()}
          height="100%"
        />
      </article>

      <Modal open={modal === "create"} onClose={() => setModal("none")} title="Create Scheduled Task">
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm" />
          <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-2">
            <select value={owner} onChange={(e) => setOwner(e.target.value as "operator" | "agent")} className="rounded border border-white/15 bg-black/20 px-2 py-2 text-sm">
              <option value="agent">Agent</option>
              <option value="operator">Operator</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as CalendarStatus)} className="rounded border border-white/15 bg-black/20 px-2 py-2 text-sm">
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" min={5} step={5} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="rounded border border-white/15 bg-black/20 px-2 py-2 text-sm" title="Duration (minutes)" />
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm" />
          <button type="button" onClick={createItem} className="w-full rounded bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">Add to Calendar</button>
        </div>
      </Modal>

      <Modal open={modal === "editTask" && !!selectedTask} onClose={() => setModal("none")} title="Edit Scheduled Task">
        {!selectedTask ? null : (
          <div className="space-y-2">
            <input value={selectedTask.title} onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })} className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm" />
            <input type="datetime-local" value={new Date(selectedTask.scheduledFor).toISOString().slice(0, 16)} onChange={(e) => setSelectedTask({ ...selectedTask, scheduledFor: new Date(e.target.value).toISOString() })} className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={selectedTask.owner} onChange={(e) => setSelectedTask({ ...selectedTask, owner: e.target.value as "operator" | "agent" })} className="rounded border border-white/15 bg-black/20 px-2 py-2 text-sm">
                <option value="agent">Agent</option>
                <option value="operator">Operator</option>
              </select>
              <select value={selectedTask.status} onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value as CalendarStatus })} className="rounded border border-white/15 bg-black/20 px-2 py-2 text-sm">
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={saveSelectedTask} className="rounded bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30">Save Changes</button>
              <button type="button" onClick={deleteSelectedTask} className="rounded bg-rose-500/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/30">Delete</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modal === "cronDetails"} onClose={() => setModal("none")} title="Cron Job Details">
        {!selectedCron ? (
          <p className="text-sm text-slate-400">No cron details available.</p>
        ) : (
          <div className="space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-400">Name:</span> {selectedCron.name}</p>
            <p><span className="text-slate-400">Enabled:</span> {String(selectedCron.enabled)}</p>
            <p><span className="text-slate-400">Schedule:</span> {selectedCron.schedule?.expr ?? selectedCron.expr ?? "n/a"}</p>
            <p><span className="text-slate-400">Schedule Type:</span> {selectedCron.schedule?.kind ?? "cron"}</p>
            <p><span className="text-slate-400">Start Date:</span> {selectedCron.createdAtMs ? new Date(selectedCron.createdAtMs).toLocaleString() : "n/a"}</p>
            <p><span className="text-slate-400">Timezone:</span> {selectedCron.schedule?.tz ?? selectedCron.tz ?? "n/a"}</p>
            <p><span className="text-slate-400">Next Run:</span> {(selectedCron.state?.nextRunAtMs ?? selectedCron.nextRunAtMs) ? new Date((selectedCron.state?.nextRunAtMs ?? selectedCron.nextRunAtMs) as number).toLocaleString() : "n/a"}</p>

            {((selectedCron as { payload?: { message?: string } }).payload?.message) ? (
              <div className="mt-2 rounded border border-white/10 bg-black/20 p-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Prompt / payload.message</p>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-200">
                  {(selectedCron as { payload?: { message?: string } }).payload?.message}
                </pre>
              </div>
            ) : null}

            <details className="mt-2 rounded border border-white/10 bg-black/20 p-3">
              <summary className="text-xs uppercase tracking-wide text-slate-400">Full JSON payload</summary>
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                {JSON.stringify(selectedCron, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Modal>
    </section>
  );
}
