// store/needsStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Need, NeedFilters, PaginatedNeeds } from "@/types/api.types";
import { needsService } from "@/lib/api/needs.service";

interface NeedsState {
  needs: Need[];
  total: number;
  page: number;
  pages: number;
  filters: NeedFilters;
  isLoading: boolean;
  error: string | null;

  fetchNeeds: (filters?: NeedFilters) => Promise<void>;
  updateNeed: (id: string, patch: Partial<Need>) => Promise<void>;
  setFilters: (f: Partial<NeedFilters>) => void;
  reset: () => void;
}

export const useNeedsStore = create<NeedsState>()(
  devtools(
    (set, get) => ({
      needs: [],
      total: 0,
      page: 1,
      pages: 1,
      filters: { page: 1, limit: 20 },
      isLoading: false,
      error: null,

      fetchNeeds: async (filters) => {
        const merged = { ...get().filters, ...filters };
        set({ isLoading: true, error: null, filters: merged }, false, "needs/fetch");
        try {
          const data: PaginatedNeeds = await needsService.list(merged);
          set(
            { needs: data.items, total: data.total, page: data.page, pages: data.pages, isLoading: false },
            false,
            "needs/fetchDone"
          );
        } catch (e: unknown) {
          set({ error: (e as Error).message, isLoading: false }, false, "needs/fetchError");
        }
      },

      updateNeed: async (id, patch) => {
        const updated = await needsService.update(id, patch);
        set(
          (s) => ({ needs: s.needs.map((n) => (n.id === id ? { ...n, ...updated } : n)) }),
          false,
          "needs/update"
        );
      },

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } }), false, "needs/setFilters"),

      reset: () => set({ needs: [], total: 0, page: 1, pages: 1 }, false, "needs/reset"),
    }),
    { name: "NeedsStore" }
  )
);