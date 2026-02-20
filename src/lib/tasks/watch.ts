import { promises as fs } from "node:fs";
import path from "node:path";
import type { TaskItem } from "./types";

const watchPath = path.join(process.cwd(), "data", "task-watch.json");

interface WatchState {
  seenUpdatedAtById: Record<string, number>;
}

async function readState(): Promise<WatchState> {
  try {
    const raw = await fs.readFile(watchPath, "utf8");
    return JSON.parse(raw) as WatchState;
  } catch {
    return { seenUpdatedAtById: {} };
  }
}

async function writeState(state: WatchState) {
  await fs.mkdir(path.dirname(watchPath), { recursive: true });
  await fs.writeFile(watchPath, JSON.stringify(state, null, 2), "utf8");
}

export async function detectNewlySelectedAgentTasks(tasks: TaskItem[]) {
  const state = await readState();
  const selected = tasks.filter((t) => t.owner === "agent" && t.status === "selected");

  const newlySelected = selected.filter((t) => {
    const seen = state.seenUpdatedAtById[t.id] ?? 0;
    return t.updatedAt > seen;
  });

  for (const task of selected) {
    state.seenUpdatedAtById[task.id] = task.updatedAt;
  }

  await writeState(state);
  return newlySelected;
}
