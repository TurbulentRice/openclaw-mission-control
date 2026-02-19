import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings/store";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as { operatorNickname?: string; agentNickname?: string };
  const settings = await saveSettings(body);
  return NextResponse.json({ ok: true, settings });
}
