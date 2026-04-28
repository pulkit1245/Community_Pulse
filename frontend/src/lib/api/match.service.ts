// lib/api/match.service.ts
import apiClient from "./client";
import type { Assignment, MatchResult } from "@/types/api.types";

export const matchService = {
  run: async (): Promise<MatchResult> => {
    const { data } = await apiClient.post<MatchResult>("/match");
    return data;
  },

  decline: async (assignmentId: string): Promise<void> => {
    await apiClient.post(`/match/decline/${assignmentId}`);
  },

  listAssignments: async (): Promise<Assignment[]> => {
    const { data } = await apiClient.get<Assignment[]>("/match");
    return data;
  },
};