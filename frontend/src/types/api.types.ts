// ─────────────────────────────────────────────────────────────
//  types/api.types.ts
//  Mirrors backend Pydantic schemas exactly.
// ─────────────────────────────────────────────────────────────

// ── Shared enums ──────────────────────────────────────────────

export type UrgencyLabel = "critical" | "moderate" | "low";
export type NeedStatus   = "unmatched" | "matched" | "in_progress" | "completed";
export type TaskStatus   = "notified" | "accepted" | "in_progress" | "completed" | "declined";
export type NeedType =
  | "food"
  | "medical"
  | "water"
  | "shelter"
  | "elderly_care"
  | "child_welfare"
  | "education"
  | "mental_health"
  | "livelihood"
  | "disability"
  | "legal"
  | "supplies";

export type SkillType =
  | "logistics"
  | "medical"
  | "food_distribution"
  | "water_safety"
  | "construction"
  | "social_work"
  | "teaching"
  | "counselling"
  | "legal"
  | "general";

// ── Need Card ─────────────────────────────────────────────────

export interface Need {
  id: string;
  type: NeedType;
  urgency_score: number;        // 0-100
  urgency_label: UrgencyLabel;
  zone: string;
  count: number;
  required_skill: SkillType;
  source: "whatsapp_voice" | "sms" | "rest" | "ocr" | "manual";
  status: NeedStatus;
  description?: string;
  created_at: string;           // ISO timestamp
  updated_at: string;
}

export interface NeedFilters {
  urgency_label?: UrgencyLabel;
  status?: NeedStatus;
  zone?: string;
  type?: NeedType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedNeeds {
  items: Need[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Volunteer ─────────────────────────────────────────────────

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: SkillType[];
  zone: string;
  available: boolean;
  reliability_score: number;    // 0-100
  created_at: string;
}

// ── Assignment (match result) ─────────────────────────────────

export interface Assignment {
  id: string;
  need_id: string;
  volunteer_id: string;
  match_score: number;          // 0-100
  need: Need;
  volunteer: Volunteer;
  created_at: string;
}

export interface MatchResult {
  assignments: Assignment[];
  unmatched_needs: Need[];
  total_needs: number;
  matched_count: number;
  run_at: string;
}

// ── Task (dispatch tracking) ──────────────────────────────────

export interface Task {
  id: string;
  assignment_id: string;
  volunteer_id: string;
  need_id: string;
  status: TaskStatus;
  dispatched_at?: string;
  accepted_at?: string;
  completed_at?: string;
  volunteer: Volunteer;
  need: Need;
}

// ── Gap Alert (WebSocket stream) ──────────────────────────────

export type AlertSeverity = "critical" | "warning" | "info";

export interface GapAlert {
  id: string;
  type: "unmatched_critical" | "trend_spike" | "zone_uncovered" | "volunteer_shortage";
  severity: AlertSeverity;
  title: string;
  description: string;
  zone?: string;
  created_at: string;
}

// ── Dashboard stats ───────────────────────────────────────────

export interface DashboardStats {
  total_needs: number;
  unmatched_needs: number;
  critical_needs: number;
  available_volunteers: number;
  total_volunteers: number;
  active_tasks: number;
  people_reached_today: number;
  avg_dispatch_minutes: number;
}

// ── Zone data (heatmap) ───────────────────────────────────────

export interface ZoneData {
  zone_id: string;
  name: string;
  need_score: number;           // 0-100 aggregated
  critical_count: number;
  moderate_count: number;
  low_count: number;
  volunteer_count: number;
  lat: number;
  lng: number;
}