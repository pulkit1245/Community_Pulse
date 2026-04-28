// lib/api/tasks.service.ts
import apiClient from "./client";
import type { Task, TaskStatus } from "@/types/api.types";

export const tasksService = {
  list: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<Task[]>("/tasks");
    return data;
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
    return data;
  },

  dispatch: async (id: string): Promise<Task> => {
    const { data } = await apiClient.post<Task>(`/tasks/${id}/dispatch`);
    return data;
  },
};

// lib/api/dashboard.service.ts — inline here for brevity
import type { DashboardStats, ZoneData } from "@/types/api.types";

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
    return data;
  },

  getZones: async (): Promise<ZoneData[]> => {
    const { data } = await apiClient.get<ZoneData[]>("/dashboard/zones");
    return data;
  },
};