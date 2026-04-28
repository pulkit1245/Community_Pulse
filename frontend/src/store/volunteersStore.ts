// store/volunteersStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Volunteer } from "@/types/api.types";
import {
  volunteersService,
  type VolunteerFilters,
  type PaginatedVolunteers,
  type CreateVolunteerPayload,
} from "@/lib/api/volunteers.service";

interface VolunteersState {
  volunteers: Volunteer[];
  total: number;
  page: number;
  pages: number;
  filters: VolunteerFilters;
  isLoading: boolean;
  error: string | null;

  fetchVolunteers: (f?: VolunteerFilters) => Promise<void>;
  createVolunteer: (p: CreateVolunteerPayload) => Promise<Volunteer>;
  updateVolunteer: (id: string, p: Partial<CreateVolunteerPayload>) => Promise<Volunteer>;
  deleteVolunteer: (id: string) => Promise<void>;
  setFilters: (f: Partial<VolunteerFilters>) => void;
}

export const useVolunteersStore = create<VolunteersState>()(
  devtools(
    (set, get) => ({
      volunteers: [],
      total: 0,
      page: 1,
      pages: 1,
      filters: { page: 1, limit: 20 },
      isLoading: false,
      error: null,

      fetchVolunteers: async (f) => {
        const merged = { ...get().filters, ...f };
        set({ isLoading: true, error: null, filters: merged }, false, "volunteers/fetch");
        try {
          const data: PaginatedVolunteers = await volunteersService.list(merged);
          set({ volunteers: data.items, total: data.total, page: data.page, pages: data.pages, isLoading: false },
            false, "volunteers/fetchDone");
        } catch (e: unknown) {
          set({ error: (e as Error).message, isLoading: false }, false, "volunteers/error");
        }
      },

      createVolunteer: async (payload) => {
        const created = await volunteersService.create(payload);
        set((s) => ({ volunteers: [created, ...s.volunteers], total: s.total + 1 }), false, "volunteers/create");
        return created;
      },

      updateVolunteer: async (id, patch) => {
        const updated = await volunteersService.update(id, patch);
        set(
          (s) => ({ volunteers: s.volunteers.map((v) => (v.id === id ? { ...v, ...updated } : v)) }),
          false, "volunteers/update"
        );
        return updated;
      },

      deleteVolunteer: async (id) => {
        await volunteersService.delete(id);
        set(
          (s) => ({ volunteers: s.volunteers.filter((v) => v.id !== id), total: s.total - 1 }),
          false, "volunteers/delete"
        );
      },

      setFilters: (f) =>
        set((s) => ({ filters: { ...s.filters, ...f } }), false, "volunteers/setFilters"),
    }),
    { name: "VolunteersStore" }
  )
);