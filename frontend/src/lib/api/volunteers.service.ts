// ─────────────────────────────────────────────────────────────
//  lib/api/volunteers.service.ts
// ─────────────────────────────────────────────────────────────

import apiClient from "./client";
import type { Volunteer } from "@/types/api.types";

export interface VolunteerFilters {
  available?: boolean;
  zone?: string;
  skill?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedVolunteers {
  items: Volunteer[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateVolunteerPayload {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  zone: string;
  available: boolean;
}

export const volunteersService = {
  list: async (filters: VolunteerFilters = {}): Promise<PaginatedVolunteers> => {
    const { data } = await apiClient.get<PaginatedVolunteers>("/volunteers", { params: filters });
    return data;
  },

  get: async (id: string): Promise<Volunteer> => {
    const { data } = await apiClient.get<Volunteer>(`/volunteers/${id}`);
    return data;
  },

  create: async (payload: CreateVolunteerPayload): Promise<Volunteer> => {
    const { data } = await apiClient.post<Volunteer>("/volunteers", payload);
    return data;
  },

  update: async (id: string, patch: Partial<CreateVolunteerPayload>): Promise<Volunteer> => {
    const { data } = await apiClient.patch<Volunteer>(`/volunteers/${id}`, patch);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/volunteers/${id}`);
  },
};