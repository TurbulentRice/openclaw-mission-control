import { NextResponse } from "next/server";
import { updateTask } from "@/lib/tasks/store";
import type { UpdateTaskInput } from "@/lib/tasks/types";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const patch = (await req.json()) as UpdateTaskInput;

  const updated = await updateTask(id, patch);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, task: updated });
}
