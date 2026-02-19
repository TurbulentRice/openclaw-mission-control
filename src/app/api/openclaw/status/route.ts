import { NextResponse } from "next/server";
import { openclawRequest } from "@/lib/openclaw/client";
import type { OpenClawProxyResponse, OpenClawStatusCard } from "@/lib/types/openclaw";

export async function GET() {
  try {
    const data = await openclawRequest<OpenClawStatusCard>({ path: "/status" });
    const response: OpenClawProxyResponse<OpenClawStatusCard> = { ok: true, data };
    return NextResponse.json(response);
  } catch (error) {
    const response: OpenClawProxyResponse = {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
