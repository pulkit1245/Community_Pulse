// ─────────────────────────────────────────────────────────────
//  lib/api/volunteers.service.ts
//  Maps backend Volunteer schema → frontend Volunteer type.
//
//  Backend fields   → Frontend fields
//  zone_id          → zone (resolved to name)
//  is_available     → available
//  page_size        → limit
//  (no reliability_score) → default 0
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

// ── Backend raw shape ─────────────────────────────────────────

interface BackendVolunteer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  skills: string[];
  zone_id: string;
  is_available: boolean;
  is_active: boolean;
  bio?: string;
  languages?: string[];
  role: string;
  total_assignments?: number;
  completed_assignments?: number;
  created_at: string;
}

interface BackendVolunteerPage {
  items: BackendVolunteer[];
  total: number;
  page: number;
  page_size: number;
}

// ── Zone cache (id → name), shared with needs service ─────────
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

function mapVolunteer(raw: BackendVolunteer, zones: Record<string, string>): Volunteer {
  const completed = raw.completed_assignments ?? 0;
  const total     = raw.total_assignments ?? 1;
  const reliability = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    id:                raw.id,
    name:              raw.name,
    email:             raw.email ?? "",
    phone:             raw.phone,
    skills:            (raw.skills ?? []) as Volunteer["skills"],
    zone:              zones[raw.zone_id] ?? raw.zone_id,
    available:         raw.is_available,
    reliability_score: reliability,
    created_at:        raw.created_at,
  };
}

// ── Service ───────────────────────────────────────────────────

export const volunteersService = {
  list: async (filters: VolunteerFilters = {}): Promise<PaginatedVolunteers> => {
    const params: Record<string, unknown> = {};
    if (filters.page)      params.page           = filters.page;
    if (filters.limit)     params.page_size       = filters.limit;
    if (filters.available !== undefined) params.available_only = filters.available;
    if (filters.zone)      params.zone_id         = filters.zone;
    if (filters.skill)     params.skill           = filters.skill;

    const zones = await getZoneCache();
    const { data } = await apiClient.get<BackendVolunteerPage>("/volunteers", { params });

    const limit = data.page_size ?? filters.limit ?? 20;
    return {
      items: data.items.map((v) => mapVolunteer(v, zones)),
      total: data.total,
      page:  data.page,
      limit,
      pages: Math.ceil(data.total / limit),
    };
  },

  get: async (id: string): Promise<Volunteer> => {
    const zones = await getZoneCache();
    const { data } = await apiClient.get<BackendVolunteer>(`/volunteers/${id}`);
    return mapVolunteer(data, zones);
  },

  create: async (payload: CreateVolunteerPayload): Promise<Volunteer> => {
    const zones = await getZoneCache();
    // Resolve zone name → zone_id
    const zoneId = Object.entries(zones).find(([, name]) => name === payload.zone)?.[0]
      ?? Object.keys(zones)[0];

    const body = {
      name:       payload.name,
      email:      payload.email,
      phone:      payload.phone,
      skills:     payload.skills,
      zone_id:    zoneId,
      is_available: payload.available,
      password:   "changeme123",  // default — user should reset
    };

    const { data } = await apiClient.post<BackendVolunteer>("/volunteers", body);
    return mapVolunteer(data, zones);
  },

  update: async (id: string, patch: Partial<CreateVolunteerPayload>): Promise<Volunteer> => {
    const zones = await getZoneCache();
    const body: Record<string, unknown> = {};
    if (patch.skills)    body.skills       = patch.skills;
    if (patch.available !== undefined) body.is_available = patch.available;

    const { data } = await apiClient.patch<BackendVolunteer>(`/volunteers/${id}`, body);
    return mapVolunteer(data, zones);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/volunteers/${id}`);
  },
};