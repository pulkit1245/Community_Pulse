"use client";
// components/match/UnmatchedNeedRow.tsx

import { motion } from "framer-motion";
import { UrgencyBadge, ZoneBadge } from "@/components/ui/Badges";
import { capitalize, timeAgo } from "@/lib/utils";
import type { Need } from "@/types/api.types";

interface UnmatchedNeedRowProps {
  need: Need;
  index: number;
}

const REASONS: Record<string, string> = {
  medical:           "No medical volunteers available in zone",
  logistics:         "No logistics volunteers available",
  food_distribution: "No food distribution volunteers in range",
  water_safety:      "No water safety volunteers assigned",
  construction:      "No construction volunteers available",
  social_work:       "No social workers in zone",
  teaching:          "No teaching volunteers available",
  counselling:       "No counsellors available",
  legal:             "No legal volunteers in system",
  general:           "All general volunteers dispatched",
};

export function UnmatchedNeedRow({ need, index }: UnmatchedNeedRowProps) {
  const reason = REASONS[need.required_skill] ?? "No matching volunteers available";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/15 bg-red-500/5 hover:bg-red-500/8 transition-colors"
    >
      {/* Alert icon */}
      <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
        </svg>
      </div>

      {/* Need info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-medium text-slate-200 capitalize">{capitalize(need.type)}</span>
          <ZoneBadge zone={need.zone} />
          <UrgencyBadge label={need.urgency_label} />
        </div>
        <p className="text-xs text-slate-500 truncate">{reason}</p>
      </div>

      {/* Meta */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-xs font-mono text-slate-400">{need.count} people</p>
        <p className="text-[10px] text-slate-600 font-mono mt-0.5">{timeAgo(need.created_at)}</p>
      </div>
    </motion.div>
  );
}