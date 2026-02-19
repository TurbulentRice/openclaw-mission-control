export type TaskStatus = "inbox" | "next" | "doing" | "blocked" | "done";
export type TaskOwner = "operator" | "agent";

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  owner: TaskOwner;
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
}
