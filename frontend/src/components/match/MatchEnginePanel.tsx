"use client";
// ─────────────────────────────────────────────────────────────
//  components/match/MatchEnginePanel.tsx
//  Left panel: algorithm details + run trigger + history
// ─────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/types/api.types";
import { useAuthStore } from "@/store/authStore";

interface MatchEnginePanelProps {
  isMatching: boolean;
  lastResult: MatchResult | null;
  history:    MatchResult[];
  onRun:      () => Promise<void>;
}

export function MatchEnginePanel({
  isMatching, lastResult, history, onRun,
}: MatchEnginePanelProps) {
  const { canMatch } = useAuthStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Algorithm card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Hungarian Algorithm</h3>
            <p className="text-[10px] text-slate-500 font-mono">scipy.optimize.linear_sum_assignment</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {[
            { label: "Complexity",  value: "O(n³)",         accent: "text-violet-400" },
            { label: "Optimality",  value: "Global optimal", accent: "text-emerald-400" },
            { label: "Strategy",    value: "Bipartite graph", accent: "text-sky-400" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04]">
              <span className="text-xs text-slate-500">{label}</span>
              <span className={cn("text-xs font-mono font-medium", accent)}>{value}</span>
            </div>
          ))}
        </div>

        {/* Weight breakdown legend */}
        <div className="space-y-2 mb-5">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Weight formula</p>
          {[
            { label: "Skill match",    pct: 45, color: "bg-violet-400" },
            { label: "Proximity",      pct: 30, color: "bg-sky-400"    },
            { label: "Availability",   pct: 25, color: "bg-emerald-400"},
          ].map(({ label, pct, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", color)} />
              <span className="text-xs text-slate-400 flex-1">{label}</span>
              <span className="text-xs font-mono text-slate-500">{pct}%</span>
              <div className="w-16 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Run button */}
        {canMatch() && (
          <motion.button
            onClick={onRun}
            disabled={isMatching}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 relative overflow-hidden",
              "flex items-center justify-center gap-2.5",
              isMatching
                ? "bg-violet-500/30 text-violet-300 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.3)]"
            )}
          >
            {/* Shimmer */}
            {!isMatching && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
              />
            )}
            <AnimatePresence mode="wait">
              {isMatching ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-violet-300/30 border-t-violet-300 rounded-full"/>
                  Running…
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Run Match Engine
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Last run summary */}
      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Last Run</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Matched",   val: lastResult.matched_count,          color: "text-emerald-400" },
              { label: "Unmatched", val: lastResult.unmatched_needs.length,  color: lastResult.unmatched_needs.length > 0 ? "text-red-400" : "text-emerald-400" },
              { label: "Total",     val: lastResult.total_needs,             color: "text-slate-300" },
              { label: "Avg Score", val: lastResult.assignments.length > 0
                ? Math.round(lastResult.assignments.reduce((s, a) => s + a.match_score, 0) / lastResult.assignments.length)
                : "—",
                color: "text-violet-400"
              },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-lg bg-white/[0.04] p-2 text-center">
                <p className={cn("text-lg font-bold font-mono", color)}>{val}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 font-mono mt-2 text-center">
            {new Date(lastResult.run_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </motion.div>
      )}

      {/* Run history list */}
      {history.length > 1 && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Run History</p>
          <div className="space-y-2">
            {history.slice(0, 5).map((r, i) => {
              const pct = r.total_needs > 0 ? Math.round((r.matched_count / r.total_needs) * 100) : 0;
              return (
                <div key={r.run_at} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(r.run_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all",
                        pct === 100 ? "bg-emerald-400" : pct > 60 ? "bg-amber-400" : "bg-red-400")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}