export type CalendarOwner = "operator" | "agent";
export type CalendarStatus = "planned" | "active" | "done" | "canceled";

export interface CalendarItem {
  id: string;
  title: string;
  owner: CalendarOwner;
  status: CalendarStatus;
  scheduledFor: string;
  durationMin?: number;
  notes?: string;
}

export interface CronSnapshot {
  id: string;
  name: string;
  enabled: boolean;
  createdAtMs?: number;
  expr?: string;
  tz?: string;
  nextRunAtMs?: number;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
  };
  schedule?: {
    kind?: string;
    expr?: string;
    tz?: string;
    at?: string;
    everyMs?: number;
  };
}
