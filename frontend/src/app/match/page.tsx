"use client";
// ─────────────────────────────────────────────────────────────
//  app/match/page.tsx
//  Match Engine page:
//    Left  — MatchEnginePanel (algorithm info + run button)
//    Right — MatchResultSummary + AssignmentCard grid + unmatched list
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell }            from "@/components/layout/AppShell";
import { MatchEnginePanel }    from "@/components/match/MatchEnginePanel";
import { MatchResultSummary }  from "@/components/match/MatchResultSummary";
import { AssignmentCard }      from "@/components/match/AssignmentCard";
import { UnmatchedNeedRow }    from "@/components/match/UnmatchedNeedRow";
import { useMatchStore }       from "@/store/matchStore";
import { useUIStore }          from "@/store/uiStore";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/types/api.types";

type SortMode = "score_desc" | "score_asc" | "urgency" | "zone";

export default function MatchPage() {
  const {
    assignments, isMatching, runMatch, declineAssignment,
  } = useMatchStore();
  const { addToast } = useUIStore();

  const [latestResult,  setLatestResult]  = useState<MatchResult | null>(null);
  const [history,       setHistory]       = useState<MatchResult[]>([]);
  const [showSummary,   setShowSummary]   = useState(false);
  const [decliningId,   setDecliningId]   = useState<string | null>(null);
  const [sortMode,      setSortMode]      = useState<SortMode>("score_desc");
  const [showUnmatched, setShowUnmatched] = useState(true);

  // ── Run match engine ──────────────────────────────────────
  const handleRun = useCallback(async () => {
    try {
      const result = await runMatch();
      setLatestResult(result);
      setHistory((h) => [result, ...h].slice(0, 10));
      setShowSummary(true);
      addToast({
        type: "success",
        title: `${result.matched_count} of ${result.total_needs} needs matched`,
        message: result.unmatched_needs.length > 0
          ? `${result.unmatched_needs.length} still unmatched — check Gap Alerts`
          : "Full coverage achieved",
      });
    } catch {
      addToast({ type: "error", title: "Match run failed", message: "Please try again" });
    }
  }, [runMatch, addToast]);

  // ── Decline + rematch ─────────────────────────────────────
  const handleDecline = useCallback(async (id: string) => {
    setDecliningId(id);
    try {
      await declineAssignment(id);
      addToast({ type: "info", title: "Assignment declined", message: "Re-running for this need…" });
    } catch {
      addToast({ type: "error", title: "Decline failed" });
    } finally {
      setDecliningId(null);
    }
  }, [declineAssignment, addToast]);

  // ── Sort assignments ──────────────────────────────────────
  const sorted = [...assignments].sort((a, b) => {
    if (sortMode === "score_desc") return b.match_score - a.match_score;
    if (sortMode === "score_asc")  return a.match_score - b.match_score;
    if (sortMode === "urgency")    return (b.need?.urgency_score ?? 0) - (a.need?.urgency_score ?? 0);
    if (sortMode === "zone")       return (a.need?.zone ?? "").localeCompare(b.need?.zone ?? "");
    return 0;
  });

  const unmatched = latestResult?.unmatched_needs ?? [];

  return (
    <AppShell title="Match Engine">
      <div className="flex flex-col xl:flex-row gap-5 min-h-full">
        {/* ── Left panel ─────────────────────────────────── */}
        <div className="xl:w-72 shrink-0">
          <MatchEnginePanel
            isMatching={isMatching}
            lastResult={latestResult}
            history={history}
            onRun={handleRun}
          />
        </div>

        {/* ── Right panel ────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Match result summary banner */}
          <AnimatePresence>
            {showSummary && latestResult && (
              <MatchResultSummary
                result={latestResult}
                onDismiss={() => setShowSummary(false)}
              />
            )}
          </AnimatePresence>

          {/* Assignments header + sort */}
          {assignments.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {assignments.length} Assignment{assignments.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-slate-500">
                  · avg score{" "}
                  <span className="font-mono text-slate-300">
                    {Math.round(assignments.reduce((s, a) => s + a.match_score, 0) / assignments.length)}
                  </span>
                </span>
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-1">
                {([
                  { value: "score_desc", label: "Score ↓" },
                  { value: "score_asc",  label: "Score ↑" },
                  { value: "urgency",    label: "Urgency"  },
                  { value: "zone",       label: "Zone"     },
                ] as { value: SortMode; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSortMode(value)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      sortMode === value
                        ? "bg-white/[0.1] text-slate-200 border border-white/[0.12]"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assignment cards grid */}
          {assignments.length === 0 && !isMatching ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-white/[0.08]"
            >
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-300 mb-1">No assignments yet</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Run the Match Engine to generate optimal volunteer–need assignments using the Hungarian algorithm.
              </p>
            </motion.div>
          ) : isMatching ? (
            /* Loading state during match run */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4 animate-pulse"
                  style={{ opacity: 1 - i * 0.1 }}>
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded-full bg-white/[0.08]" />
                      <div className="h-3 w-20 rounded-full bg-white/[0.06]" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/[0.07]" />
                  </div>
                  <div className="h-14 rounded-xl bg-white/[0.05]" />
                  <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {sorted.map((assignment, i) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    index={i}
                    onDecline={handleDecline}
                    isDeclining={decliningId === assignment.id}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Unmatched needs section */}
          <AnimatePresence>
            {unmatched.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2"
              >
                <button
                  onClick={() => setShowUnmatched((v) => !v)}
                  className="flex items-center gap-2 mb-3 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-400">
                      {unmatched.length} Unmatched Need{unmatched.length !== 1 ? "s" : ""}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                      Gap Alert
                    </span>
                  </div>
                  <motion.svg
                    animate={{ rotate: showUnmatched ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="group-hover:opacity-80 transition-opacity"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </motion.svg>
                </button>

                <AnimatePresence>
                  {showUnmatched && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <p className="text-xs text-slate-500 mb-3">
                        These needs could not be matched — no available volunteers with the required skill in their zone.
                        Consider adding volunteers or running again after availability updates.
                      </p>
                      {unmatched.map((need, i) => (
                        <UnmatchedNeedRow key={need.id} need={need} index={i} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}