export type TaskStatus = "inbox" | "selected" | "doing" | "blocked" | "done";
export type TaskOwner = "operator" | "agent";

export interface TaskComment {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  author: TaskOwner;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  owner: TaskOwner;
  active?: boolean;
  /** Optional link to a pull request related to this task. */
  prUrl?: string;
  comments?: TaskComment[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  owner: TaskOwner;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  owner?: TaskOwner;
  status?: TaskStatus;
  active?: boolean;
  prUrl?: string;
  comments?: TaskComment[];
}
