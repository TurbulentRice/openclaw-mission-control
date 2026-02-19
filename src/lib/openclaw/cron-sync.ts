import { promisify } from "node:util";
import { execFile } from "node:child_process";
import type { CronSnapshot } from "@/lib/calendar/types";

const execFileAsync = promisify(execFile);

function extractJson(raw: string) {
  const firstBracket = raw.indexOf("[");
  const firstBrace = raw.indexOf("{");
  const start =
    firstBracket === -1
      ? firstBrace
      : firstBrace === -1
        ? firstBracket
        : Math.min(firstBracket, firstBrace);
  if (start < 0) return raw;
  return raw.slice(start);
}

export async function fetchCronSnapshotsLive(): Promise<CronSnapshot[]> {
  const { stdout } = await execFileAsync("openclaw", ["cron", "list", "--all", "--json"], {
    timeout: 20_000,
    maxBuffer: 1024 * 1024,
  });

  const jsonText = extractJson(stdout.trim());
  const parsed = JSON.parse(jsonText) as { jobs?: CronSnapshot[] } | CronSnapshot[];

  if (Array.isArray(parsed)) return parsed;
  return parsed.jobs ?? [];
}
