// store/tasksStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Task, TaskStatus } from "@/types/api.types";
import { tasksService } from "@/lib/api/tasks.service";

export const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string; accent: string }[] = [
  { id: "notified",    label: "Notified",    color: "border-sky-500/30",     accent: "bg-sky-500/15 text-sky-400"     },
  { id: "accepted",    label: "Accepted",    color: "border-violet-500/30",  accent: "bg-violet-500/15 text-violet-400" },
  { id: "in_progress", label: "In Progress", color: "border-amber-500/30",   accent: "bg-amber-500/15 text-amber-400"  },
  { id: "completed",   label: "Completed",   color: "border-emerald-500/30", accent: "bg-emerald-500/15 text-emerald-400" },
];

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  dispatchingId: string | null;

  // Derived
  byStatus: Record<TaskStatus, Task[]>;

  fetchTasks: () => Promise<void>;
  updateStatus: (id: string, status: TaskStatus) => Promise<void>;
  dispatchTask: (id: string) => Promise<void>;
}

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map: Record<TaskStatus, Task[]> = {
    notified: [], accepted: [], in_progress: [], completed: [], declined: [],
  };
  for (const t of tasks) {
    if (map[t.status]) map[t.status].push(t);
  }
  return map;
}

export const useTasksStore = create<TasksState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,
      dispatchingId: null,
      byStatus: groupByStatus([]),

      fetchTasks: async () => {
        set({ isLoading: true, error: null }, false, "tasks/fetch");
        try {
          const tasks = await tasksService.list();
          set({ tasks, byStatus: groupByStatus(tasks), isLoading: false }, false, "tasks/done");
        } catch (e: unknown) {
          set({ error: (e as Error).message, isLoading: false }, false, "tasks/error");
        }
      },

      updateStatus: async (id, status) => {
        // Optimistic update
        const prev = get().tasks;
        const next = prev.map((t) => (t.id === id ? { ...t, status } : t));
        set({ tasks: next, byStatus: groupByStatus(next) }, false, "tasks/statusOptimistic");
        try {
          const updated = await tasksService.updateStatus(id, status);
          const confirmed = get().tasks.map((t) => (t.id === id ? { ...t, ...updated } : t));
          set({ tasks: confirmed, byStatus: groupByStatus(confirmed) }, false, "tasks/statusConfirmed");
        } catch {
          // Roll back
          set({ tasks: prev, byStatus: groupByStatus(prev) }, false, "tasks/statusRollback");
          throw new Error("Status update failed");
        }
      },

      dispatchTask: async (id) => {
        set({ dispatchingId: id }, false, "tasks/dispatching");
        try {
          const updated = await tasksService.dispatch(id);
          const tasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updated } : t));
          set({ tasks, byStatus: groupByStatus(tasks), dispatchingId: null }, false, "tasks/dispatched");
        } catch {
          set({ dispatchingId: null }, false, "tasks/dispatchError");
          throw new Error("Dispatch failed");
        }
      },
    }),
    { name: "TasksStore" }
  )
);