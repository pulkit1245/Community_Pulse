// lib/api/needs.service.ts
import apiClient from "./client";
import type { Need, NeedFilters, PaginatedNeeds } from "@/types/api.types";

export const needsService = {
  list: async (filters: NeedFilters = {}): Promise<PaginatedNeeds> => {
    const { data } = await apiClient.get<PaginatedNeeds>("/needs", { params: filters });
    return data;
  },

  get: async (id: string): Promise<Need> => {
    const { data } = await apiClient.get<Need>(`/needs/${id}`);
    return data;
  },

  update: async (id: string, patch: Partial<Need>): Promise<Need> => {
    const { data } = await apiClient.patch<Need>(`/needs/${id}`, patch);
    return data;
  },

  ingest: async (payload: {
    description: string;
    zone?: string;
    type?: string;
  }): Promise<Need> => {
    const { data } = await apiClient.post<Need>("/ingest", payload);
    return data;
  },
};