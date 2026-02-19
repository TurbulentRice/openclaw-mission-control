import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { CalendarItem, CronSnapshot } from "./types";

export interface CronCachePayload {
  cachedAtMs: number;
  cron: CronSnapshot[];
  cronEvents: Array<{ id: string; cronId: string; title: string; start: string }>;
}

const root = process.cwd();
const calendarPath = path.join(root, "data", "calendar.json");
const cronPath = path.join(root, "data", "openclaw-cron.json");
const cronCachePath = path.join(root, "data", "openclaw-cron-cache.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, value: T) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function listCalendarItems() {
  return readJson<CalendarItem[]>(calendarPath, []);
}

export async function listCronSnapshots() {
  return readJson<CronSnapshot[]>(cronPath, []);
}

export async function saveCronSnapshots(items: CronSnapshot[]) {
  await writeJson(cronPath, items);
}

export async function getCronCache() {
  return readJson<CronCachePayload | null>(cronCachePath, null);
}

export async function saveCronCache(payload: CronCachePayload) {
  await writeJson(cronCachePath, payload);
}

export async function addCalendarItem(input: Omit<CalendarItem, "id">) {
  const items = await listCalendarItems();
  const next: CalendarItem = { id: crypto.randomUUID(), ...input };
  await writeJson(calendarPath, [next, ...items]);
  return next;
}

export async function updateCalendarItem(id: string, patch: Partial<Omit<CalendarItem, "id">>) {
  const items = await listCalendarItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const updated: CalendarItem = { ...items[idx], ...patch };
  items[idx] = updated;
  await writeJson(calendarPath, items);
  return updated;
}

export async function deleteCalendarItem(id: string) {
  const items = await listCalendarItems();
  const next = items.filter((i) => i.id !== id);
  await writeJson(calendarPath, next);
}
