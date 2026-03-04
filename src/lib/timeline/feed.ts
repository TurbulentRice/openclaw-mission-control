import { listTasks } from "@/lib/tasks/store";
import { listCalendarItems, listCronSnapshots } from "@/lib/calendar/store";
import { listMemoryDocs } from "@/lib/memory/store";
import type { TimelineEvent, TimelineFeed, TimelineSourceStatus } from "@/lib/timeline/types";

function truncate(text: string, max = 180) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function statusSeverity(status?: string): TimelineEvent["severity"] {
  if (!status) return "info";
  if (status === "ok" || status === "success") return "success";
  if (status === "timeout") return "warning";
  return "error";
}

function classifySourceError(error: unknown): TimelineSourceStatus {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (msg.includes("timed out") || msg.includes("timeout") || msg.includes("abort")) return "timeout";
  if (msg.includes("permission") || msg.includes("forbidden") || msg.includes("unauthorized") || msg.includes("denied")) return "denied";
  return "error";
}

export async function buildTimelineFeed(limit = 250): Promise<TimelineFeed> {
  const warnings: string[] = [];
  const events: TimelineEvent[] = [];

  const sources: TimelineFeed["sources"] = {
    cron: "ok",
    tasks: "ok",
    calendar: "ok",
    memory: "ok",
  };

  try {
    const cron = await listCronSnapshots();
    let hasCronDegradation = false;

    for (const job of cron) {
      const lastRunAtMs = job.state?.lastRunAtMs;
      if (lastRunAtMs) {
        const status = job.state?.lastStatus;
        const consecutiveErrors = typeof job.state?.consecutiveErrors === "number" ? job.state.consecutiveErrors : 0;
        if (status && status !== "ok" && status !== "success") {
          hasCronDegradation = true;
        }
        if (consecutiveErrors > 0) {
          hasCronDegradation = true;
        }

        events.push({
          id: `cron-run:${job.id}:${lastRunAtMs}`,
          ts: lastRunAtMs,
          source: "openclaw",
          kind: "cron_run",
          severity: statusSeverity(status),
          title: `${job.name} ran`,
          summary: `${status ?? "unknown"}${typeof job.state?.lastDurationMs === "number" ? ` · ${Math.round(job.state.lastDurationMs / 1000)}s` : ""}${typeof job.state?.consecutiveErrors === "number" ? ` · ${job.state.consecutiveErrors} consecutive errors` : ""}`,
          tags: ["cron", status ?? "unknown"],
          metadata: {
            cronId: job.id,
            enabled: job.enabled,
            lastError: job.state?.lastError,
          },
        });
      }

      const nextRunAtMs = job.state?.nextRunAtMs ?? job.nextRunAtMs;
      if (nextRunAtMs) {
        events.push({
          id: `cron-next:${job.id}:${nextRunAtMs}`,
          ts: nextRunAtMs,
          source: "openclaw",
          kind: "cron_scheduled",
          severity: "info",
          title: `${job.name} scheduled`,
          summary: `Next run${job.enabled ? "" : " (disabled)"}`,
          tags: ["cron", "scheduled", job.enabled ? "enabled" : "disabled"],
          metadata: {
            cronId: job.id,
            schedule: job.schedule?.expr ?? job.expr,
            tz: job.schedule?.tz ?? job.tz,
          },
        });
      }
    }

    if (hasCronDegradation) {
      sources.cron = "degraded";
    }
  } catch (error) {
    sources.cron = classifySourceError(error);
    warnings.push(error instanceof Error ? `Cron timeline unavailable: ${error.message}` : "Cron timeline unavailable");
  }

  try {
    const tasks = await listTasks();
    for (const task of tasks) {
      events.push({
        id: `task:${task.id}:${task.updatedAt}`,
        ts: task.updatedAt,
        source: "mission_control",
        kind: "task_update",
        severity: task.status === "blocked" ? "warning" : task.status === "done" ? "success" : "info",
        title: task.title,
        summary: `Task ${task.status} · owner ${task.owner}`,
        tags: ["tasks", task.status, task.owner],
        metadata: {
          taskId: task.id,
          commentCount: task.comments?.length ?? 0,
        },
      });
    }
  } catch (error) {
    sources.tasks = classifySourceError(error);
    warnings.push(error instanceof Error ? `Task timeline unavailable: ${error.message}` : "Task timeline unavailable");
  }

  try {
    const items = await listCalendarItems();
    for (const item of items) {
      const ts = new Date(item.scheduledFor).getTime();
      if (Number.isNaN(ts)) continue;
      events.push({
        id: `calendar:${item.id}:${item.scheduledFor}`,
        ts,
        source: "mission_control",
        kind: "calendar_item",
        severity: item.status === "canceled" ? "warning" : item.status === "done" ? "success" : "info",
        title: item.title,
        summary: `Calendar ${item.status} · owner ${item.owner}`,
        tags: ["calendar", item.status, item.owner],
        metadata: { calendarId: item.id, durationMin: item.durationMin },
      });
    }
  } catch (error) {
    sources.calendar = classifySourceError(error);
    warnings.push(error instanceof Error ? `Calendar timeline unavailable: ${error.message}` : "Calendar timeline unavailable");
  }

  try {
    const docs = await listMemoryDocs();
    for (const doc of docs) {
      events.push({
        id: `memory:${doc.id}:${doc.updatedAtMs}`,
        ts: Math.round(doc.updatedAtMs),
        source: "memory",
        kind: "memory_update",
        severity: "info",
        title: doc.title,
        summary: `Updated ${doc.filePath}`,
        tags: ["memory", "document"],
        metadata: {
          filePath: doc.filePath,
          preview: truncate(doc.content.replace(/\s+/g, " "), 120),
        },
      });
    }
  } catch (error) {
    sources.memory = classifySourceError(error);
    warnings.push(error instanceof Error ? `Memory timeline unavailable: ${error.message}` : "Memory timeline unavailable");
  }

  const sorted = events
    .filter((event) => Number.isFinite(event.ts))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, Math.max(1, limit));

  return {
    ok: true,
    events: sorted,
    generatedAtMs: Date.now(),
    sources,
    warnings,
  };
}
