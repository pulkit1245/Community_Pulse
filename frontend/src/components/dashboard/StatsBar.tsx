"use client";
// components/dashboard/StatsBar.tsx

import { StatCard, SkeletonCard } from "@/components/ui/Badges";
import type { DashboardStats } from "@/types/api.types";

interface StatsBarProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const utilPct = stats.total_volunteers > 0
    ? Math.round((stats.available_volunteers / stats.total_volunteers) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Unmatched Needs"
        value={stats.unmatched_needs}
        sub={`of ${stats.total_needs} total`}
        accent="sky"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/>
          </svg>
        }
      />
      <StatCard
        label="Critical Needs"
        value={stats.critical_needs}
        sub="requiring urgent response"
        accent="red"
        trend={stats.critical_needs > 3 ? "up" : "down"}
        trendValue={stats.critical_needs > 3 ? "High load" : "Under control"}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
          </svg>
        }
      />
      <StatCard
        label="Available Volunteers"
        value={stats.available_volunteers}
        sub={`${utilPct}% of ${stats.total_volunteers} active`}
        accent="emerald"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        }
      />
      <StatCard
        label="Avg. Dispatch"
        value={`${stats.avg_dispatch_minutes}m`}
        sub={`${stats.people_reached_today} reached today`}
        accent="violet"
        trend="down"
        trendValue="vs 45m baseline"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        }
      />
    </div>
  );
}