import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { CreateTaskInput, TaskItem, UpdateTaskInput } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dataPath = path.join(dataDir, "tasks.json");

const seedTasks: TaskItem[] = [
  {
    id: "task-mc-foundation",
    title: "Mission Control foundation scaffold",
    description: "Complete infra/db/scaffold/styles/docs baseline for Mission Control.",
    status: "done",
    owner: "agent",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "task-mc-task-board",
    title: "Implement Mission Control task board",
    description: "Add live board with owner + status tracking and inline updates.",
    status: "doing",
    owner: "agent",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify(seedTasks, null, 2), "utf8");
  }
}

export async function listTasks(): Promise<TaskItem[]> {
  await ensureStore();
  const raw = await fs.readFile(dataPath, "utf8");
  const parsed = JSON.parse(raw) as TaskItem[];
  const normalized = parsed.map((t) => ({ ...t, comments: t.comments ?? [] }));
  return normalized.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function createTask(input: CreateTaskInput): Promise<TaskItem> {
  const tasks = await listTasks();
  const now = Date.now();
  const item: TaskItem = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    owner: input.owner,
    status: input.status ?? "inbox",
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
  const next = [item, ...tasks];
  await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf8");
  return item;
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<TaskItem | null> {
  const tasks = await listTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx < 0) return null;

  const updated: TaskItem = {
    ...tasks[idx],
    ...patch,
    updatedAt: Date.now(),
  };

  tasks[idx] = updated;
  await fs.writeFile(dataPath, JSON.stringify(tasks, null, 2), "utf8");
  return updated;
}
