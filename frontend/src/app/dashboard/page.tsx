"use client";
// ─────────────────────────────────────────────────────────────
//  app/dashboard/page.tsx
//  Main coordinator dashboard — polls stats & needs every 10s,
//  renders all 5 dashboard widgets.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatsBar }     from "@/components/dashboard/StatsBar";
import { NeedsQueue }   from "@/components/dashboard/NeedsQueue";
import { MatchButton }  from "@/components/dashboard/MatchButton";
import { GapAlertFeed } from "@/components/dashboard/GapAlertFeed";
import { ZoneHeatmap }  from "@/components/dashboard/ZoneHeatmap";
import { dashboardService } from "@/lib/api/tasks.service";
import { needsService }     from "@/lib/api/needs.service";
import type { DashboardStats, ZoneData, Need } from "@/types/api.types";

const POLL_INTERVAL = 10_000; // 10 seconds

export default function DashboardPage() {
  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [zones,       setZones]       = useState<ZoneData[]>([]);
  const [critNeeds,   setCritNeeds]   = useState<Need[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNeeds, setLoadingNeeds] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [s, z] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getZones(),
      ]);
      setStats(s);
      setZones(z);
    } catch {
      // Silently fail on poll; error shown on first load via loading state
    } finally {
      setLoadingStats(false);
    }

    try {
      const paged = await needsService.list({
        status: "unmatched",
        limit: 8,
        page: 1,
      });
      // Sort by urgency_score desc
      const sorted = [...paged.items].sort((a, b) => b.urgency_score - a.urgency_score);
      setCritNeeds(sorted);
    } catch {
      // ignore
    } finally {
      setLoadingNeeds(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <AppShell title="Dashboard">
      {/* KPI row */}
      <StatsBar stats={stats} isLoading={loadingStats} />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left column — heatmap (2 cols wide) */}
        <div className="xl:col-span-2 grid grid-rows-[auto_auto] gap-4">
          <ZoneHeatmap zones={zones} isLoading={loadingStats} />
          <GapAlertFeed />
        </div>

        {/* Right column — needs queue + match */}
        <div className="flex flex-col gap-4">
          <MatchButton />
          <div className="flex-1 min-h-0">
            <NeedsQueue needs={critNeeds} isLoading={loadingNeeds} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}