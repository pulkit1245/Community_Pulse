"use client";
// components/match/MatchResultSummary.tsx

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/types/api.types";

interface MatchResultSummaryProps {
  result: MatchResult;
  onDismiss: () => void;
}

export function MatchResultSummary({ result, onDismiss }: MatchResultSummaryProps) {
  const pct = result.total_needs > 0
    ? Math.round((result.matched_count / result.total_needs) * 100)
    : 0;

  const avgScore = result.assignments.length > 0
    ? Math.round(result.assignments.reduce((s, a) => s + a.match_score, 0) / result.assignments.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5 mb-5"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Checkmark icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
            className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </motion.div>
          <div>
            <h3 className="text-sm font-semibold text-white">Match Run Complete</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(result.run_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Matched",    value: result.matched_count,            accent: "text-emerald-300" },
          { label: "Unmatched",  value: result.unmatched_needs.length,   accent: result.unmatched_needs.length > 0 ? "text-red-300" : "text-emerald-300" },
          { label: "Coverage",   value: `${pct}%`,                       accent: pct === 100 ? "text-emerald-300" : pct > 60 ? "text-amber-300" : "text-red-300" },
          { label: "Avg Score",  value: avgScore,                        accent: avgScore >= 80 ? "text-emerald-300" : avgScore >= 55 ? "text-amber-300" : "text-red-300" },
        ].map(({ label, value, accent }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 text-center"
          >
            <p className={cn("text-xl font-bold font-mono", accent)}>{value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Coverage bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400">Coverage rate</span>
          <span className="text-xs font-mono text-slate-300">{result.matched_count} / {result.total_needs} needs</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/[0.07] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "h-full rounded-full",
              pct === 100 ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                : pct > 60  ? "bg-gradient-to-r from-amber-600 to-amber-400"
                : "bg-gradient-to-r from-red-600 to-red-400"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}