import { NextResponse } from "next/server";
import { listTasks, updateTask } from "@/lib/tasks/store";
import type { TaskComment, TaskItem } from "@/lib/tasks/types";
import { executeTaskWithOpenClaw, markTaskAttempt, shouldRunTask } from "@/lib/tasks/runner";

function addComment(task: TaskItem, body: string): TaskComment[] {
  const marker = task.updatedAt + (task.comments?.length ?? 0) + 1;
  const next: TaskComment = {
    id: `${task.id}-runner-${marker}`,
    body,
    author: "agent",
    createdAt: marker,
    updatedAt: marker,
  };
  return [...(task.comments ?? []), next];
}

export async function POST() {
  const tasks = await listTasks();
  const doing = tasks.filter((t) => t.owner === "agent" && t.status === "doing");

  const processed: Array<{ id: string; decision: string; summary: string }> = [];

  for (const task of doing) {
    const okToRun = await shouldRunTask(task);
    if (!okToRun) continue;

    await markTaskAttempt(task.id);
    const result = await executeTaskWithOpenClaw(task);

    const commentText = [
      `Runner decision: ${result.decision}`,
      `Summary: ${result.summary}`,
      result.details ? `Details: ${result.details}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const comments = addComment(task, commentText);

    if (result.decision === "done") {
      await updateTask(task.id, { status: "done", comments });
    } else if (result.decision === "blocked") {
      await updateTask(task.id, { status: "blocked", comments });
    } else {
      await updateTask(task.id, { status: "doing", comments });
    }

    processed.push({ id: task.id, decision: result.decision, summary: result.summary });

    // One task per tick to avoid saturating the local runner.
    break;
  }

  return NextResponse.json({ ok: true, processed });
}
