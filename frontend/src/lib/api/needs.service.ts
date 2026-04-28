// lib/api/needs.service.ts
// ─────────────────────────────────────────────────────────────
//  Maps backend Need schema → frontend Need type.
//  Backend fields   → Frontend fields
//  category         → type
//  urgency          → urgency_label  +  urgency_score (derived)
//  people_count     → count
//  skills_required  → required_skill (first skill)
//  zone_id          → zone (resolved to name)
//  source           → source (kept as-is, normalised)
//  page_size        → limit
//  total / page     → pages (derived)
// ─────────────────────────────────────────────────────────────

import apiClient from "./client";
import type { Need, NeedFilters, PaginatedNeeds, UrgencyLabel } from "@/types/api.types";

// ── Urgency mapping ───────────────────────────────────────────
const URGENCY_SCORE: Record<string, number> = {
  critical: 95,
  high:     70,
  medium:   40,
  low:      10,
};

// "high" → "critical", "medium" → "moderate", "low" → "low"
function toUrgencyLabel(u: string): UrgencyLabel {
  if (u === "critical" || u === "high") return "critical";
  if (u === "medium")                   return "moderate";
  return "low";
}

// ── Source normalisation ──────────────────────────────────────
const SRC_MAP: Record<string, Need["source"]> = {
  whatsapp:       "whatsapp_voice",
  whatsapp_voice: "whatsapp_voice",
  sms:            "sms",
  api:            "rest",
  rest:           "rest",
  ocr:            "ocr",
  manual:         "manual",
  seed:           "manual",
};

// ── Zone cache (id → name) ────────────────────────────────────
let _zoneCache: Record<string, string> | null = null;

async function getZoneCache(): Promise<Record<string, string>> {
  if (_zoneCache) return _zoneCache;
  try {
    const { data } = await apiClient.get<{ items: { id: string; name: string }[] }>("/zones");
    _zoneCache = Object.fromEntries(data.items.map((z) => [z.id, z.name]));
  } catch {
    _zoneCache = {};
  }
  return _zoneCache!;
}

// ── Backend raw shape ─────────────────────────────────────────
interface BackendNeed {
  id: string;
  title: string;
  description?: string;
  category: string;
  urgency: string;
  status: string;
  zone_id: string;
  requester_name?: string;
  requester_phone?: string;
  skills_required: string[];
  people_count: number;
  source: string;
  created_at: string;
  updated_at: string;
}

interface BackendPage {
  items: BackendNeed[];
  total: number;
  page: number;
  page_size: number;
}

function mapNeed(raw: BackendNeed, zones: Record<string, string>): Need {
  return {
    id:            raw.id,
    type:          (raw.category as Need["type"]) ?? "supplies",
    urgency_label: toUrgencyLabel(raw.urgency),
    urgency_score: URGENCY_SCORE[raw.urgency] ?? 10,
    zone:          zones[raw.zone_id] ?? raw.zone_id,
    count:         raw.people_count ?? 1,
    required_skill: ((raw.skills_required?.[0] ?? "general") as Need["required_skill"]),
    source:        SRC_MAP[raw.source] ?? "manual",
    status:        (raw.status as Need["status"]) ?? "unmatched",
    description:   raw.description,
    created_at:    raw.created_at,
    updated_at:    raw.updated_at,
  };
}

// ── Service ───────────────────────────────────────────────────
export const needsService = {
  list: async (filters: NeedFilters = {}): Promise<PaginatedNeeds> => {
    // Map frontend filter keys → backend query params
    const params: Record<string, unknown> = {};
    if (filters.page)          params.page      = filters.page;
    if (filters.limit)         params.page_size = filters.limit;
    if (filters.status) {
      // Map frontend status terms → backend NeedStatus values
      const statusMap: Record<string, string> = {
        unmatched:   "open",
        matched:     "assigned",
        in_progress: "in_progress",
        completed:   "completed",
      };
      params.status = statusMap[filters.status] ?? filters.status;
    }
    if (filters.urgency_label) {
      // Map frontend labels back to backend urgency values
      const map: Record<string, string> = { critical: "critical", moderate: "medium", low: "low" };
      params.urgency = map[filters.urgency_label] ?? filters.urgency_label;
    }
    if (filters.type)  params.category = filters.type;
    if (filters.zone)  params.zone_id  = filters.zone;

    const zones = await getZoneCache();
    const { data } = await apiClient.get<BackendPage>("/needs", { params });

    const limit = data.page_size ?? filters.limit ?? 20;
    return {
      items: data.items.map((n) => mapNeed(n, zones)),
      total: data.total,
      page:  data.page,
      limit,
      pages: Math.ceil(data.total / limit),
    };
  },

  get: async (id: string): Promise<Need> => {
    const zones = await getZoneCache();
    const { data } = await apiClient.get<BackendNeed>(`/needs/${id}`);
    return mapNeed(data, zones);
  },

  update: async (id: string, patch: Partial<Need>): Promise<Need> => {
    // Map frontend patch keys back to backend keys
    const body: Record<string, unknown> = {};
    if (patch.urgency_label) {
      const map: Record<string, string> = { critical: "high", moderate: "medium", low: "low" };
      body.urgency = map[patch.urgency_label] ?? patch.urgency_label;
    }
    if (patch.status) body.status = patch.status;
    if (patch.count)  body.people_count = patch.count;

    const zones = await getZoneCache();
    const { data } = await apiClient.patch<BackendNeed>(`/needs/${id}`, body);
    return mapNeed(data, zones);
  },

  ingest: async (payload: {
    description: string;
    zone?: string;
    type?: string;
  }): Promise<Need> => {
    const zones = await getZoneCache();
    // Find zone_id from name if possible
    const zoneId = zones
      ? Object.entries(zones).find(([, name]) => name === payload.zone)?.[0]
      : undefined;

    const body = {
      title:           payload.description.slice(0, 100),
      description:     payload.description,
      category:        payload.type ?? "supplies",
      urgency:         "medium",
      zone_id:         zoneId ?? Object.keys(zones)[0],
      requester_phone: "+919000000000",
      source:          "api",
    };

    const { data } = await apiClient.post<BackendNeed>("/ingest", body);
    return mapNeed(data, zones);
  },
};