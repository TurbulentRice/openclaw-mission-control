import { NextResponse } from "next/server";
import { buildTimelineFeed } from "@/lib/timeline/feed";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 250;

  const payload = await buildTimelineFeed(Number.isFinite(limit) ? limit : 250);
  return NextResponse.json(payload);
}
