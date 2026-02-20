export type TimelineEventSource = "openclaw" | "mission_control" | "memory";

export type TimelineEventKind =
  | "cron_run"
  | "cron_scheduled"
  | "task_update"
  | "calendar_item"
  | "memory_update"
  | "system_status";

export type TimelineSeverity = "info" | "success" | "warning" | "error";

export interface TimelineEvent {
  id: string;
  ts: number;
  source: TimelineEventSource;
  kind: TimelineEventKind;
  severity: TimelineSeverity;
  title: string;
  summary: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface TimelineFeed {
  ok: boolean;
  events: TimelineEvent[];
  generatedAtMs: number;
  sources: {
    cron: "ok" | "error";
    tasks: "ok" | "error";
    calendar: "ok" | "error";
    memory: "ok" | "error";
    openclawStatus: "ok" | "error";
  };
  warnings: string[];
}
