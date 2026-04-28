"use client";
// ─────────────────────────────────────────────────────────────
//  app/needs/page.tsx
//  Full needs management page:
//    • Filter bar (search, urgency, status, type)
//    • Sortable table with animated rows
//    • Click-to-open detail drawer
//    • Ingest modal (free text + structured)
//    • Pagination
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { AppShell }          from "@/components/layout/AppShell";
import { NeedFiltersBar }    from "@/components/needs/NeedFiltersBar";
import { NeedsTable }        from "@/components/needs/NeedsTable";
import { NeedDetailDrawer }  from "@/components/needs/NeedDetailDrawer";
import { IngestModal }       from "@/components/needs/IngestModal";
import { Pagination }        from "@/components/ui/Pagination";
import { useNeeds }          from "@/hooks/useNeeds";
import type { Need }         from "@/types/api.types";

export default function NeedsPage() {
  const {
    needs, total, page, pages,
    filters, isLoading,
    applyFilters, goToPage, patchNeed, ingestNeed,
  } = useNeeds({ status: undefined, limit: 20 });

  const [selectedNeed, setSelectedNeed]   = useState<Need | null>(null);
  const [ingestOpen,   setIngestOpen]     = useState(false);

  return (
    <AppShell title="Needs">
      {/* Filter bar */}
      <NeedFiltersBar
        filters={filters}
        total={total}
        onFilter={applyFilters}
        onIngestOpen={() => setIngestOpen(true)}
      />

      {/* Table */}
      <NeedsTable
        needs={needs}
        isLoading={isLoading}
        onSelect={setSelectedNeed}
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
      <NeedDetailDrawer
        need={selectedNeed}
        onClose={() => setSelectedNeed(null)}
        onPatch={patchNeed}
      />

      {/* Ingest modal */}
      <IngestModal
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        onSubmit={ingestNeed}
      />
    </AppShell>
  );
}