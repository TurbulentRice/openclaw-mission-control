import { AppShell } from "@/components/layout/app-shell";
import { TaskBoard } from "@/components/task-board";

export default function TasksPage() {
  return (
    <AppShell>
      <TaskBoard />
    </AppShell>
  );
}
