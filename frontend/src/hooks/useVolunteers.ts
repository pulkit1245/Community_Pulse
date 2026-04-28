"use client";
// hooks/useVolunteers.ts
import { useEffect, useCallback } from "react";
import { useVolunteersStore } from "@/store/volunteersStore";
import { useUIStore } from "@/store/uiStore";
import type { VolunteerFilters, CreateVolunteerPayload } from "@/lib/api/volunteers.service";
import type { Volunteer } from "@/types/api.types";

export function useVolunteers(initialFilters?: VolunteerFilters) {
  const store = useVolunteersStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    store.fetchVolunteers(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(
    (f: Partial<VolunteerFilters>) => {
      const next = { ...f, page: 1 };
      store.setFilters(next);
      store.fetchVolunteers(next);
    },
    [store]
  );

  const goToPage = useCallback(
    (p: number) => {
      store.setFilters({ page: p });
      store.fetchVolunteers({ page: p });
    },
    [store]
  );

  const createVolunteer = useCallback(
    async (payload: CreateVolunteerPayload): Promise<Volunteer> => {
      try {
        const v = await store.createVolunteer(payload);
        addToast({ type: "success", title: "Volunteer created", message: v.name });
        return v;
      } catch {
        addToast({ type: "error", title: "Create failed" });
        throw new Error("Create failed");
      }
    },
    [store, addToast]
  );

  const updateVolunteer = useCallback(
    async (id: string, patch: Partial<CreateVolunteerPayload>): Promise<Volunteer> => {
      try {
        const v = await store.updateVolunteer(id, patch);
        addToast({ type: "success", title: "Volunteer updated" });
        return v;
      } catch {
        addToast({ type: "error", title: "Update failed" });
        throw new Error("Update failed");
      }
    },
    [store, addToast]
  );

  const deleteVolunteer = useCallback(
    async (id: string) => {
      try {
        await store.deleteVolunteer(id);
        addToast({ type: "success", title: "Volunteer removed" });
      } catch {
        addToast({ type: "error", title: "Delete failed" });
      }
    },
    [store, addToast]
  );

  return {
    ...store,
    applyFilters,
    goToPage,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
  };
}