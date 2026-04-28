// ─────────────────────────────────────────────────────────────
//  lib/api/tasks.service.ts
//  Maps backend Assignment schema → frontend Task type.
//
//  Backend GET /tasks returns a flat array of assignments:
//    { id, need_id, volunteer_id, status, match_score, ... }
//
//  Frontend Task type expects:
//    { id, assignment_id, volunteer_id, need_id, status,
//      volunteer: Volunteer, need: Need, ... }
// ─────────────────────────────────────────────────────────────

import apiClient from "./client";
import type { Task, TaskStatus, Volunteer, Need } from "@/types/api.types";

// ── Backend shapes ────────────────────────────────────────────

interface BackendAssignment {
  id: string;
  need_id: string;
  volunteer_id: string;
  status: string;
  match_score?: number;
  notes?: string;
  decline_reason?: string;
  notification_sent_at?: string;
  accepted_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Stubs for nested objects (we don't have full data in list) ─
function stubVolunteer(id: string): Volunteer {
  return {
    id,
    name: "",
    email: "",
    phone: "",
    skills: [],
    zone: "",
    available: true,
    reliability_score: 0,
    created_at: new Date().toISOString(),
  };
}

function stubNeed(id: string): Need {
  return {
    id,
    type: "supplies",
    urgency_label: "low",
    urgency_score: 10,
    zone: "",
    count: 1,
    required_skill: "general",
    source: "manual",
    status: "unmatched",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapAssignment(raw: BackendAssignment): Task {
  return {
    id:             raw.id,
    assignment_id:  raw.id,
    volunteer_id:   raw.volunteer_id,
    need_id:        raw.need_id,
    status:         (raw.status as TaskStatus) ?? "notified",
    dispatched_at:  raw.notification_sent_at,
    accepted_at:    raw.accepted_at,
    completed_at:   raw.completed_at,
    volunteer:      stubVolunteer(raw.volunteer_id),
    need:           stubNeed(raw.need_id),
  };
}

// ── Service ───────────────────────────────────────────────────

export const tasksService = {
  list: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<BackendAssignment[]>("/tasks");
    return Array.isArray(data) ? data.map(mapAssignment) : [];
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const { data } = await apiClient.patch<BackendAssignment>(`/tasks/${id}/status`, { status });
    return mapAssignment(data);
  },

  dispatch: async (id: string): Promise<Task> => {
    const { data } = await apiClient.post<BackendAssignment>(`/tasks/${id}/dispatch`);
    return mapAssignment(data);
  },
};

// ── Dashboard service (stats + zones) ────────────────────────
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