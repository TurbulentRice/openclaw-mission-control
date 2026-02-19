import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/tasks/store";
import type { CreateTaskInput } from "@/lib/tasks/types";

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json({ ok: true, tasks });
}

export async function POST(req: Request) {
  const body = (await req.json()) as CreateTaskInput;

  if (!body?.title?.trim()) {
    return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
  }

  if (!body?.owner || !["operator", "agent"].includes(body.owner)) {
    return NextResponse.json({ ok: false, error: "owner must be 'operator' or 'agent'" }, { status: 400 });
  }

  const task = await createTask(body);
  return NextResponse.json({ ok: true, task }, { status: 201 });
}
