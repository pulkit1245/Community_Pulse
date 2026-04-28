// store/matchStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Assignment, MatchResult } from "@/types/api.types";
import { matchService } from "@/lib/api/match.service";

interface MatchState {
  assignments: Assignment[];
  unmatchedNeeds: number;
  lastRunAt: string | null;
  isMatching: boolean;
  error: string | null;

  runMatch: () => Promise<MatchResult>;
  declineAssignment: (id: string) => Promise<void>;
  fetchAssignments: () => Promise<void>;
}

export const useMatchStore = create<MatchState>()(
  devtools(
    (set, get) => ({
      assignments: [],
      unmatchedNeeds: 0,
      lastRunAt: null,
      isMatching: false,
      error: null,

      runMatch: async () => {
        set({ isMatching: true, error: null }, false, "match/run");
        try {
          const result = await matchService.run();
          set(
            {
              assignments: result.assignments,
              unmatchedNeeds: result.unmatched_needs.length,
              lastRunAt: result.run_at,
              isMatching: false,
            },
            false,
            "match/done"
          );
          return result;
        } catch (e: unknown) {
          set({ error: (e as Error).message, isMatching: false }, false, "match/error");
          throw e;
        }
      },

      declineAssignment: async (id) => {
        await matchService.decline(id);
        // Remove declined assignment optimistically; re-fetch to get rematch
        set(
          (s) => ({ assignments: s.assignments.filter((a) => a.id !== id) }),
          false,
          "match/decline"
        );
        await get().fetchAssignments();
      },

      fetchAssignments: async () => {
        const result = await matchService.listAssignments();
        set({ assignments: result }, false, "match/fetchAssignments");
      },
    }),
    { name: "MatchStore" }
  )
);