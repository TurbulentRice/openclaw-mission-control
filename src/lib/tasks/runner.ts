import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { TaskItem } from "./types";

const execFileAsync = promisify(execFile);
const statePath = path.join(process.cwd(), "data", "task-runner-state.json");

interface RunnerState {
  lastAttemptAtByTaskId: Record<string, number>;
}

interface RunnerDecision {
  decision: "done" | "blocked" | "in_progress";
  summary: string;
  details?: string;
}

function extractJson(text: string): RunnerDecision | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as RunnerDecision;
    if (!parsed.decision || !parsed.summary) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readState(): Promise<RunnerState> {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    return JSON.parse(raw) as RunnerState;
  } catch {
    return { lastAttemptAtByTaskId: {} };
  }
}

async function writeState(state: RunnerState) {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
}

export async function shouldRunTask(task: TaskItem, cooldownMs = 45_000) {
  const state = await readState();
  const last = state.lastAttemptAtByTaskId[task.id] ?? 0;
  return Date.now() - last >= cooldownMs;
}

export async function markTaskAttempt(taskId: string) {
  const state = await readState();
  state.lastAttemptAtByTaskId[taskId] = Date.now();
  await writeState(state);
}

export async function executeTaskWithOpenClaw(task: TaskItem): Promise<RunnerDecision> {
  const lastComments = (task.comments ?? []).slice(-4).map((c) => `- ${c.body}`).join("\n");
  const prompt = [
    "You are an autonomous task runner for Mission Control.",
    "Complete the task if possible; use subagents if it helps.",
    "If you need human input/approval, mark blocked.",
    "Respond with ONLY strict JSON:",
    '{"decision":"done|blocked|in_progress","summary":"short summary","details":"optional"}',
    "",
    `Task title: ${task.title}`,
    `Task description: ${task.description ?? "(none)"}`,
    `Task status: ${task.status}`,
    `Recent comments:\n${lastComments || "(none)"}`,
  ].join("\n");

  try {
    const { stdout } = await execFileAsync(
      "openclaw",
      ["agent", "--message", prompt, "--json", "--thinking", "low", "--timeout", "240"],
      { timeout: 260_000, maxBuffer: 1024 * 1024 }
    );

    const parsed = extractJson(stdout);
    if (parsed) return parsed;

    return {
      decision: "in_progress",
      summary: "Runner received non-JSON output; task remains Doing",
      details: stdout.slice(0, 1200),
    };
  } catch (error) {
    return {
      decision: "blocked",
      summary: "Runner failed to execute task",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
