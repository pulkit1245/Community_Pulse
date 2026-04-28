"use client";
// hooks/useTasks.ts
import { useEffect, useCallback } from "react";
import { useTasksStore } from "@/store/tasksStore";
import { useUIStore } from "@/store/uiStore";
import type { TaskStatus } from "@/types/api.types";

const POLL_INTERVAL = 15_000;

export function useTasks() {
  const store = useTasksStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    store.fetchTasks();
    const id = setInterval(store.fetchTasks, POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      try {
        await store.updateStatus(id, status);
        addToast({ type: "success", title: "Status updated", message: status.replace(/_/g, " ") });
      } catch {
        addToast({ type: "error", title: "Update failed", message: "Could not update task status" });
      }
    },
    [store, addToast]
  );

  const dispatchTask = useCallback(
    async (id: string) => {
      try {
        await store.dispatchTask(id);
        addToast({ type: "success", title: "Dispatched", message: "Volunteer notified via WhatsApp / SMS" });
      } catch {
        addToast({ type: "error", title: "Dispatch failed" });
      }
    },
    [store, addToast]
  );

  return {
    tasks:       store.tasks,
    byStatus:    store.byStatus,
    isLoading:   store.isLoading,
    dispatchingId: store.dispatchingId,
    refresh:     store.fetchTasks,
    updateStatus,
    dispatchTask,
  };
}