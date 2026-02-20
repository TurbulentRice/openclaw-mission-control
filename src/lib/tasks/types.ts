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
  comments?: TaskComment[];
}
