"use client";
// ─────────────────────────────────────────────────────────────
//  app/volunteers/page.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { AppShell }                from "@/components/layout/AppShell";
import { VolunteerFiltersBar }     from "@/components/volunteers/VolunteerFiltersBar";
import { VolunteersTable }         from "@/components/volunteers/VolunteersTable";
import { VolunteerDetailDrawer }   from "@/components/volunteers/VolunteerDetailDrawer";
import { VolunteerFormModal }      from "@/components/volunteers/VolunteerFormModal";
import { Pagination }              from "@/components/ui/Pagination";
import { useVolunteers }           from "@/hooks/useVolunteers";
import { useAuthStore }            from "@/store/authStore";
import type { Volunteer }          from "@/types/api.types";

export default function VolunteersPage() {
  const {
    volunteers, total, page, pages,
    filters, isLoading,
    applyFilters, goToPage,
    createVolunteer, updateVolunteer, deleteVolunteer,
  } = useVolunteers({ limit: 20 });

  const { canWrite } = useAuthStore();

  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [editVolunteer,     setEditVolunteer]     = useState<Volunteer | null>(null);
  const [createOpen,        setCreateOpen]        = useState(false);

  function handleEdit(v: Volunteer) {
    setSelectedVolunteer(null); // close drawer first
    setEditVolunteer(v);
  }

  return (
    <AppShell title="Volunteers">
      {/* Filter bar */}
      <VolunteerFiltersBar
        filters={filters}
        total={total}
        onFilter={applyFilters}
        onCreateOpen={() => setCreateOpen(true)}
      />

      {/* Table */}
      <VolunteersTable
        volunteers={volunteers}
        isLoading={isLoading}
        onSelect={setSelectedVolunteer}
        onEdit={handleEdit}
        canWrite={canWrite()}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        limit={filters.limit ?? 20}
        onPage={goToPage}
      />

      {/* Detail drawer */}
      <VolunteerDetailDrawer
        volunteer={selectedVolunteer}
        onClose={() => setSelectedVolunteer(null)}
        onEdit={handleEdit}
      />

      {/* Create modal */}
      <VolunteerFormModal
        open={createOpen}
        volunteer={null}
        onClose={() => setCreateOpen(false)}
        onCreate={createVolunteer}
        onUpdate={async () => {}}
      />

      {/* Edit modal */}
      <VolunteerFormModal
        open={!!editVolunteer}
        volunteer={editVolunteer}
        onClose={() => setEditVolunteer(null)}
        onCreate={async () => {}}
        onUpdate={updateVolunteer}
        onDelete={deleteVolunteer}
      />
    </AppShell>
  );
}