// lib/api/match.service.ts
// ─────────────────────────────────────────────────────────────
//  Adapts backend MatchResponse → frontend MatchResult type.
//
//  Backend returns:
//    { assignments: [{need_id, volunteer_id, match_score, assignment_id}],
//      total_matched: number, unmatched_needs: string[], dry_run: bool }
//
//  Frontend expects (MatchResult):
//    { assignments: Assignment[], unmatched_needs: Need[],
//      total_needs: number, matched_count: number, run_at: string }
// ─────────────────────────────────────────────────────────────

import apiClient from "./client";
import type { Assignment, MatchResult, Need } from "@/types/api.types";

// ── Raw backend shapes ────────────────────────────────────────

interface BackendMatchItem {
  need_id: string;
  volunteer_id: string;
  match_score: number;
  assignment_id: string | null;
}

interface BackendMatchResponse {
  assignments: BackendMatchItem[];
  total_matched: number;
  unmatched_needs: string[];   // array of need UUIDs
  dry_run: boolean;
}

// ── Minimal stubs so the frontend components don't crash ──────
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

function stubAssignment(item: BackendMatchItem): Assignment {
  return {
    id: item.assignment_id ?? item.need_id,
    need_id: item.need_id,
    volunteer_id: item.volunteer_id,
    match_score: item.match_score,
    need: stubNeed(item.need_id),
    volunteer: {
      id: item.volunteer_id,
      name: "",
      email: "",
      phone: "",
      skills: [],
      zone: "",
      available: true,
      reliability_score: 0,
      created_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };
}

function adaptResponse(raw: BackendMatchResponse): MatchResult {
  return {
    assignments:     raw.assignments.map(stubAssignment),
    unmatched_needs: raw.unmatched_needs.map(stubNeed),
    total_needs:     raw.total_matched + raw.unmatched_needs.length,
    matched_count:   raw.total_matched,
    run_at:          new Date().toISOString(),
  };
}

// ── Service ───────────────────────────────────────────────────

export const matchService = {
  run: async (): Promise<MatchResult> => {
    const { data } = await apiClient.post<BackendMatchResponse>("/match", {});
    return adaptResponse(data);
  },

  decline: async (assignmentId: string): Promise<void> => {
    await apiClient.post(`/match/decline/${assignmentId}`);
  },

  listAssignments: async (): Promise<Assignment[]> => {
    // Backend doesn't have GET /match — return empty; assignments come from POST /match
    return [];
  },
};