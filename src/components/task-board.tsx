"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { TaskComment, TaskItem, TaskOwner, TaskStatus } from "@/lib/tasks/types";

const statuses: TaskStatus[] = ["inbox", "selected", "doing", "blocked", "done"];

const statusLabel: Record<TaskStatus, string> = {
  inbox: "Inbox",
  selected: "Selected",
  doing: "Doing",
  blocked: "Blocked",
  done: "Done",
};

const statusHeaderStyle: Record<TaskStatus, string> = {
  inbox: "border-slate-300/30 bg-slate-400/10",
  selected: "border-cyan-300/40 bg-cyan-400/10",
  doing: "border-emerald-300/40 bg-emerald-400/10",
  blocked: "border-rose-300/40 bg-rose-400/10",
  done: "border-violet-300/40 bg-violet-400/10",
};

function ownerTone(owner: TaskOwner) {
  return owner === "agent"
    ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
    : "border-amber-300/30 bg-amber-400/10 text-amber-200";
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose} role="presentation">
      <article className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0b1220] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10">Close</button>
        </div>
        {children}
      </article>
    </div>
  );
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<TaskOwner>("agent");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [watchNotice, setWatchNotice] = useState<TaskItem[]>([]);
  const [nicknames, setNicknames] = useState({ operator: "Operator", agent: "Agent" });

  async function loadTasks() {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      const normalized = (json.tasks as TaskItem[]).map((t) => ({
        ...t,
        status: t.status === ("next" as TaskStatus) ? ("selected" as TaskStatus) : t.status,
        comments: t.comments ?? [],
      }));
      setTasks(normalized);
    }
    setLoading(false);
  }

  async function pollWatchService() {
    const res = await fetch("/api/tasks/watch", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setWatchNotice((json.newlySelected as TaskItem[]) ?? []);
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadTasks();
    void (async () => {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setNicknames({
          operator: json.settings.operatorNickname,
          agent: json.settings.agentNickname,
        });
      }
    })();

    void pollWatchService();

    const i = setInterval(() => void loadTasks(), 3000);
    const w = setInterval(() => void pollWatchService(), 5000);
    return () => {
      clearInterval(i);
      clearInterval(w);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const grouped = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    }, {} as Record<TaskStatus, TaskItem[]>);
  }, [tasks]);

  async function createTask() {
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), owner }),
    });
    if (res.ok) {
      setTitle("");
      await loadTasks();
    }
  }

  async function patchTask(id: string, patch: Partial<TaskItem>) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await loadTasks();
  }

  async function moveTaskToStatus(status: TaskStatus) {
    if (!draggedTaskId) return;
    await patchTask(draggedTaskId, { status });
    setDraggedTaskId(null);
  }

  function appendCommentDraft(task: TaskItem, comment: TaskComment): TaskItem {
    return { ...task, comments: [...(task.comments ?? []), comment] };
  }

  async function saveSelectedTask() {
    if (!selectedTask) return;
    await patchTask(selectedTask.id, {
      title: selectedTask.title,
      description: selectedTask.description,
      owner: selectedTask.owner,
      status: selectedTask.status,
      comments: selectedTask.comments ?? [],
    });
    setModalOpen(false);
  }

  async function startTaskWithPlan(task: TaskItem) {
    const plan = `Implementation plan:\n1) Clarify acceptance criteria\n2) Break work into sub-steps/sub-agents if needed\n3) Implement incrementally\n4) Validate and report outcome`;
    const ordinal = (task.comments?.length ?? 0) + 1;
    const marker = task.updatedAt + ordinal;
    const withComment = appendCommentDraft(
      { ...task, status: "doing" },
      {
        id: `${task.id}-plan-${ordinal}`,
        body: plan,
        author: "agent",
        createdAt: marker,
        updatedAt: marker,
      }
    );
    await patchTask(task.id, {
      status: "doing",
      comments: withComment.comments,
    });
    setWatchNotice((prev) => prev.filter((t) => t.id !== task.id));
  }

  return (
    <section className="flex h-[calc(100vh-3rem)] min-h-0 flex-col gap-4">
      <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
        <h3 className="text-xl font-semibold">Tasks</h3>
        <p className="mt-1 text-sm text-slate-300">Shared mission board for {nicknames.operator} + {nicknames.agent}. Drag between columns or click a task for full details.</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none ring-cyan-300/40 placeholder:text-slate-500 focus:ring"
          />
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value as TaskOwner)}
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
          >
            <option value="agent">{nicknames.agent}</option>
            <option value="operator">{nicknames.operator}</option>
          </select>
          <button
            type="button"
            onClick={createTask}
            className="rounded-lg bg-cyan-400/20 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/30"
          >
            Add
          </button>
        </div>

        {watchNotice.length > 0 ? (
          <div className="mt-3 space-y-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-200">Agent attention needed</p>
            {watchNotice.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-100">{task.title}</span>
                <button
                  type="button"
                  onClick={() => void startTaskWithPlan(task)}
                  className="rounded border border-cyan-300/40 bg-cyan-400/15 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-400/25"
                >
                  Move to Doing + seed plan
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </article>

      <article className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="grid h-full gap-3 xl:grid-cols-5">
          {statuses.map((status) => (
            <section
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void moveTaskToStatus(status);
              }}
              className={`flex min-h-0 flex-col rounded-2xl border p-3 transition ${
                draggedTaskId ? "border-cyan-300/40 bg-cyan-400/5" : statusHeaderStyle[status]
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-100">{statusLabel[status]}</h4>
                <span className="rounded border border-white/20 px-1.5 py-0.5 text-xs text-slate-200">{grouped[status]?.length ?? 0}</span>
              </div>

              <div className="space-y-2 overflow-auto pr-1">
                {(grouped[status] ?? []).map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                    onClick={() => {
                      setSelectedTask(task);
                      setModalOpen(true);
                    }}
                    className="cursor-pointer rounded-lg border border-white/10 bg-[#111a2d] p-2 hover:border-cyan-300/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-100">{task.title}</p>
                      {(task.comments?.length ?? 0) > 0 ? (
                        <span className="rounded border border-violet-300/35 bg-violet-400/10 px-1.5 py-0.5 text-[10px] text-violet-200">
                          {(task.comments?.length ?? 0)}
                        </span>
                      ) : null}
                    </div>
                    {task.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-400">{task.description}</p> : null}
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className={`rounded border px-1.5 py-0.5 ${ownerTone(task.owner)}`}>
                        {task.owner === "agent" ? nicknames.agent : nicknames.operator}
                      </span>
                      <span>Updated {new Date(task.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </article>
                ))}

                {!loading && (grouped[status]?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-500">Drop tasks here</p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </article>

      <Modal open={modalOpen && !!selectedTask} onClose={() => setModalOpen(false)} title="Task Details">
        {!selectedTask ? null : (
          <div className="space-y-3">
            <input
              value={selectedTask.title}
              onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
              className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm"
            />
            <textarea
              value={selectedTask.description ?? ""}
              onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
              rows={5}
              className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm"
              placeholder="Description"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedTask.owner}
                onChange={(e) => setSelectedTask({ ...selectedTask, owner: e.target.value as TaskOwner })}
                className="rounded border border-white/15 bg-black/20 px-2 py-2 text-sm"
              >
                <option value="agent">{nicknames.agent}</option>
                <option value="operator">{nicknames.operator}</option>
              </select>
              <select
                value={selectedTask.status}
                onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value as TaskStatus })}
                className="rounded border border-white/15 bg-black/20 px-2 py-2 text-sm"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-100">Comments</h4>
              <div className="space-y-2">
                {(selectedTask.comments ?? []).map((comment, idx) => (
                  <div key={comment.id} className="rounded border border-white/10 bg-black/25 p-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{comment.author === "agent" ? nicknames.agent : nicknames.operator}</span>
                      <span>{new Date(comment.updatedAt).toLocaleString()}</span>
                    </div>
                    <textarea
                      value={comment.body}
                      onChange={(e) => {
                        const next = [...(selectedTask.comments ?? [])];
                        next[idx] = { ...next[idx], body: e.target.value, updatedAt: Date.now() };
                        setSelectedTask({ ...selectedTask, comments: next });
                      }}
                      rows={3}
                      className="w-full rounded border border-white/15 bg-black/20 px-2 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-2 flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  placeholder="Add a comment..."
                  className="flex-1 rounded border border-white/15 bg-black/20 px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newComment.trim()) return;
                    const ordinal = (selectedTask.comments?.length ?? 0) + 1;
                    const marker = selectedTask.updatedAt + ordinal;
                    const updated = appendCommentDraft(selectedTask, {
                      id: `${selectedTask.id}-comment-${ordinal}`,
                      body: newComment.trim(),
                      author: "agent",
                      createdAt: marker,
                      updatedAt: marker,
                    });
                    setSelectedTask(updated);
                    setNewComment("");
                  }}
                  className="rounded border border-cyan-300/35 bg-cyan-400/15 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-400/25"
                >
                  Add
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={saveSelectedTask}
              className="w-full rounded bg-cyan-400/20 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30"
            >
              Save Task
            </button>
          </div>
        )}
      </Modal>
    </section>
  );
}
