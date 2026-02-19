import { NextResponse } from "next/server";
import {
  addCalendarItem,
  getCronCache,
  listCalendarItems,
  listCronSnapshots,
  saveCronCache,
  saveCronSnapshots,
} from "@/lib/calendar/store";
import { fetchCronSnapshotsLive } from "@/lib/openclaw/cron-sync";
import { generateCronEvents } from "@/lib/openclaw/cron-occurrences";

const CRON_CACHE_TTL_MS = 60_000;
let refreshInFlight: Promise<void> | null = null;

async function refreshCronCache() {
  const liveCron = await fetchCronSnapshotsLive();
  await saveCronSnapshots(liveCron);
  const liveEvents = generateCronEvents(liveCron);
  await saveCronCache({
    cachedAtMs: Date.now(),
    cron: liveCron,
    cronEvents: liveEvents,
  });
}

async function getCronDataFast() {
  const cached = await getCronCache();
  const now = Date.now();

  if (cached) {
    const isStale = now - cached.cachedAtMs > CRON_CACHE_TTL_MS;

    if (isStale && !refreshInFlight) {
      refreshInFlight = refreshCronCache().finally(() => {
        refreshInFlight = null;
      });
    }

    return {
      cron: cached.cron,
      cronEvents: cached.cronEvents,
      cache: {
        cachedAtMs: cached.cachedAtMs,
        stale: isStale,
      },
    };
  }

  try {
    await refreshCronCache();
    const fresh = await getCronCache();
    if (fresh) {
      return {
        cron: fresh.cron,
        cronEvents: fresh.cronEvents,
        cache: {
          cachedAtMs: fresh.cachedAtMs,
          stale: false,
        },
      };
    }
  } catch {
    // fall through to snapshot fallback
  }

  const fallbackCron = await listCronSnapshots();
  return {
    cron: fallbackCron,
    cronEvents: generateCronEvents(fallbackCron),
    cache: {
      cachedAtMs: now,
      stale: true,
      fallback: true,
    },
  };
}

export async function GET() {
  const [items, cronData] = await Promise.all([listCalendarItems(), getCronDataFast()]);

  return NextResponse.json({
    ok: true,
    items,
    cron: cronData.cron,
    cronEvents: cronData.cronEvents,
    cache: cronData.cache,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.title || !body?.scheduledFor || !body?.owner || !body?.status) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const item = await addCalendarItem({
    title: body.title,
    owner: body.owner,
    status: body.status,
    scheduledFor: body.scheduledFor,
    durationMin: body.durationMin,
    notes: body.notes,
  });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
