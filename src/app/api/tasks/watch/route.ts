import { NextResponse } from "next/server";
import { listTasks } from "@/lib/tasks/store";
import { detectNewlySelectedAgentTasks } from "@/lib/tasks/watch";

export async function GET() {
  const tasks = await listTasks();
  const selectedAgentTasks = tasks.filter((t) => t.owner === "agent" && t.status === "selected");
  const newlySelected = await detectNewlySelectedAgentTasks(tasks);

  return NextResponse.json({
    ok: true,
    selectedAgentTasks,
    newlySelected,
  });
}
