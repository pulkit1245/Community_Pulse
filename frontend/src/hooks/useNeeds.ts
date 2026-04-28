"use client";
// ─────────────────────────────────────────────────────────────
//  hooks/useNeeds.ts
//  Wraps needsStore with local filter/pagination state and
//  provides imperative helpers used by the Needs page.
// ─────────────────────────────────────────────────────────────

import { useEffect, useCallback, useState } from "react";
import { useNeedsStore } from "@/store/needsStore";
import { useUIStore } from "@/store/uiStore";
import { needsService } from "@/lib/api/needs.service";
import type { NeedFilters, Need } from "@/types/api.types";

export function useNeeds(initialFilters?: NeedFilters) {
  const {
    needs, total, page, pages,
    filters, isLoading, error,
    fetchNeeds, updateNeed, setFilters,
  } = useNeedsStore();

  const { addToast } = useUIStore();

  // ── Initial fetch + filter change re-fetch ─────────────────
  useEffect(() => {
    fetchNeeds(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(
    (f: Partial<NeedFilters>) => {
      const next = { ...f, page: 1 };   // reset to page 1 on filter change
      setFilters(next);
      fetchNeeds(next);
    },
    [fetchNeeds, setFilters]
  );

  const goToPage = useCallback(
    (p: number) => {
      setFilters({ page: p });
      fetchNeeds({ page: p });
    },
    [fetchNeeds, setFilters]
  );

  const patchNeed = useCallback(
    async (id: string, patch: Partial<Need>) => {
      try {
        await updateNeed(id, patch);
        addToast({ type: "success", title: "Need updated" });
      } catch {
        addToast({ type: "error", title: "Update failed", message: "Please try again" });
      }
    },
    [updateNeed, addToast]
  );

  // ── Ingest a new need ──────────────────────────────────────
  const ingestNeed = useCallback(
    async (payload: { description: string; zone?: string; type?: string }) => {
      try {
        const created = await needsService.ingest(payload);
        addToast({ type: "success", title: "Need ingested", message: `ID: ${created.id}` });
        await fetchNeeds();   // refresh list
        return created;
      } catch {
        addToast({ type: "error", title: "Ingest failed", message: "Check input and try again" });
        throw new Error("Ingest failed");
      }
    },
    [fetchNeeds, addToast]
  );

  return {
    needs, total, page, pages,
    filters, isLoading, error,
    applyFilters, goToPage, patchNeed, ingestNeed,
    refresh: fetchNeeds,
  };
}

// ── Single need detail ──────────────────────────────────────
export function useNeed(id: string | null) {
  const [need, setNeed]       = useState<Need | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setNeed(null); return; }
    setLoading(true);
    needsService.get(id)
      .then(setNeed)
      .catch(() => setNeed(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { need, loading };
}