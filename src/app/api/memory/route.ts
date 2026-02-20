import { NextResponse } from "next/server";
import { listMemoryDocs } from "@/lib/memory/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const docs = await listMemoryDocs(q);

  return NextResponse.json({
    ok: true,
    docs: docs.map((d) => ({
      id: d.id,
      title: d.title,
      filePath: d.filePath,
      updatedAtMs: d.updatedAtMs,
      content: d.content,
    })),
  });
}
