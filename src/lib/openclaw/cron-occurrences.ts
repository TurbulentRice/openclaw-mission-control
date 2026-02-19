import { CronExpressionParser } from "cron-parser";
import type { CronSnapshot } from "@/lib/calendar/types";

export interface CalendarCronEvent {
  id: string;
  cronId: string;
  title: string;
  start: string;
}

function buildCronExpr(job: CronSnapshot): string | null {
  return job.schedule?.expr ?? job.expr ?? null;
}

export function generateCronEvents(jobs: CronSnapshot[], horizonDays = 14): CalendarCronEvent[] {
  const now = new Date();
  const end = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const out: CalendarCronEvent[] = [];
  const maxEventsPerJob = 600;

  for (const job of jobs) {
    if (job.enabled === false) continue;

    const schedule = job.schedule;
    const kind = schedule?.kind;
    const jobStart = new Date(job.createdAtMs ?? now.getTime());

    if (kind === "at" && schedule?.at) {
      const dt = new Date(schedule.at);
      if (dt >= jobStart && dt <= end) {
        out.push({ id: `cron:${job.id}:at`, cronId: job.id, title: `🦞 ${job.name}`, start: dt.toISOString() });
      }
      continue;
    }

    if (kind === "every" && schedule?.everyMs) {
      const step = schedule.everyMs;
      if (step <= 0) continue;
      let t = jobStart.getTime();
      let count = 0;
      while (t <= end.getTime() && count < maxEventsPerJob) {
        if (t >= jobStart.getTime()) {
          out.push({ id: `cron:${job.id}:${t}`, cronId: job.id, title: `🦞 ${job.name}`, start: new Date(t).toISOString() });
          count += 1;
        }
        t += step;
      }
      continue;
    }

    const expr = buildCronExpr(job);
    if (!expr) {
      const nextRun = job.state?.nextRunAtMs ?? job.nextRunAtMs;
      if (nextRun) {
        out.push({
          id: `cron:${job.id}:${nextRun}`,
          cronId: job.id,
          title: `🦞 ${job.name}`,
          start: new Date(nextRun).toISOString(),
        });
      }
      continue;
    }

    try {
      const interval = CronExpressionParser.parse(expr, {
        currentDate: jobStart,
        startDate: jobStart,
        endDate: end,
        tz: schedule?.tz ?? job.tz,
      });

      for (let i = 0; i < maxEventsPerJob; i += 1) {
        try {
          const next = interval.next().toDate();
          out.push({
            id: `cron:${job.id}:${next.getTime()}`,
            cronId: job.id,
            title: `🦞 ${job.name}`,
            start: next.toISOString(),
          });
        } catch {
          break;
        }
      }
    } catch {
      const nextRun = job.state?.nextRunAtMs ?? job.nextRunAtMs;
      if (nextRun) {
        out.push({
          id: `cron:${job.id}:${nextRun}`,
          cronId: job.id,
          title: `🦞 ${job.name}`,
          start: new Date(nextRun).toISOString(),
        });
      }
    }
  }

  return out.sort((a, b) => +new Date(a.start) - +new Date(b.start));
}
