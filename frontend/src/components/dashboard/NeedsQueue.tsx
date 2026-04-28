"use client";
// components/dashboard/NeedsQueue.tsx

import Link from "next/link";
import { motion } from "framer-motion";
import { UrgencyBadge, ZoneBadge } from "@/components/ui/Badges";
import { timeAgo, capitalize } from "@/lib/utils";
import type { Need } from "@/types/api.types";

interface NeedsQueueProps {
  needs: Need[];
  isLoading: boolean;
}

export function NeedsQueue({ needs, isLoading }: NeedsQueueProps) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-sm font-semibold text-white">Needs Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sorted by urgency score</p>
        </div>
        <Link href="/needs" className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium">
          View all →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : needs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-sm font-medium text-slate-300">All needs matched</p>
            <p className="text-xs text-slate-500 mt-1">No unmatched needs at this time</p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="divide-y divide-white/[0.04]"
          >
            {needs.map((need) => (
              <motion.li
                key={need.id}
                variants={{
                  hidden:  { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200">{capitalize(need.type)}</span>
                      <ZoneBadge zone={need.zone} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-500">{need.count} {need.count === 1 ? "person" : "people"}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-500 font-mono">{timeAgo(need.created_at)}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-500">{need.required_skill.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <UrgencyBadge label={need.urgency_label} score={need.urgency_score} />
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}