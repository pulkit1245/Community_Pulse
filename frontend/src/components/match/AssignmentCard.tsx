"use client";
// ─────────────────────────────────────────────────────────────
//  components/match/AssignmentCard.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, ZoneBadge } from "@/components/ui/Badges";
import { VolunteerAvatar, SkillBadge, ReliabilityBar } from "@/components/volunteers/VolunteerPrimitives";
import { MatchScoreBreakdown } from "./MatchScoreBreakdown";
import { timeAgo, capitalize, cn } from "@/lib/utils";
import type { Assignment } from "@/types/api.types";
import { useAuthStore } from "@/store/authStore";

interface AssignmentCardProps {
  assignment: Assignment;
  index: number;
  onDecline: (id: string) => Promise<void>;
  isDeclining: boolean;
}

export function AssignmentCard({ assignment, index, onDecline, isDeclining }: AssignmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const { canMatch } = useAuthStore();

  const { need, volunteer } = assignment;

  const scoreColor =
    assignment.match_score >= 80 ? "#34d399" :
    assignment.match_score >= 55 ? "#fbbf24" : "#f87171";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border bg-white/[0.03] hover:bg-white/[0.05] transition-colors overflow-hidden",
        need?.urgency_label === "critical" ? "border-red-500/20" :
        need?.urgency_label === "moderate" ? "border-amber-500/15" : "border-white/[0.07]"
      )}
    >
      {/* Critical top stripe */}
      {need?.urgency_label === "critical" && (
        <div className="h-0.5 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60" />
      )}

      <div className="p-5">
        {/* Header row: need info + score badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-base font-semibold text-slate-100 capitalize">
                {need ? capitalize(need.type) : "—"}
              </span>
              {need && <ZoneBadge zone={need.zone} />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {need && <UrgencyBadge label={need.urgency_label} score={need.urgency_score} />}
              {need && (
                <span className="text-xs text-slate-500">
                  <span className="font-mono text-slate-300">{need.count}</span> {need.count === 1 ? "person" : "people"}
                </span>
              )}
            </div>
          </div>

          {/* Score ring */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="relative w-12 h-12">
              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                <motion.circle
                  cx="24" cy="24" r="18"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - assignment.match_score / 100) }}
                  transition={{ duration: 0.8, delay: index * 0.05 + 0.15, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold font-mono" style={{ color: scoreColor }}>
                  {assignment.match_score}
                </span>
              </div>
            </div>
            <span className="text-[9px] text-slate-600 font-mono uppercase tracking-wide">score</span>
          </div>
        </div>

        {/* Connection line between need and volunteer */}
        <div className="relative flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.04]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="text-[9px] text-sky-400/70 font-mono">MATCHED</span>
          </div>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Volunteer row */}
        {volunteer && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.05] mb-3">
            <VolunteerAvatar name={volunteer.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{volunteer.name}</p>
              <p className="text-xs text-slate-500 truncate">{volunteer.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <ZoneBadge zone={volunteer.zone} />
                <div className="w-16">
                  <ReliabilityBar score={volunteer.reliability_score} showLabel={false} />
                </div>
                <span className="text-[10px] font-mono text-slate-500">{volunteer.reliability_score}</span>
              </div>
            </div>
            {/* Top matching skill */}
            {volunteer.skills[0] && (
              <SkillBadge skill={volunteer.skills[0]} size="sm" />
            )}
          </div>
        )}

        {/* Required skill vs volunteer skill match indicator */}
        {need && volunteer && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-[10px] text-slate-600">Needs:</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
              volunteer.skills.some((s) => s === need.required_skill)
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                : volunteer.skills.some((s) => s.includes(need.required_skill?.split("_")[0] ?? ""))
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                : "bg-red-500/15 text-red-400 border border-red-500/25"
            )}>
              {need.required_skill?.replace(/_/g, " ")}
            </span>
            {volunteer.skills.some((s) => s === need.required_skill) ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                Exact match
              </span>
            ) : (
              <span className="text-[10px] text-amber-400">Related skill</span>
            )}
          </div>
        )}

        {/* Score breakdown (expandable) */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-2 px-3 rounded-xl border border-white/[0.06] bg-white/[0.03] mb-3">
                <MatchScoreBreakdown score={assignment.match_score} compact={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {/* Expand score breakdown */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <motion.svg
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6"/>
              </motion.svg>
              {expanded ? "Hide breakdown" : "Score breakdown"}
            </button>

            <span className="text-slate-700">·</span>
            <span className="text-[10px] text-slate-600 font-mono">
              {need ? timeAgo(need.created_at) : ""}
            </span>
          </div>

          {/* Decline button (coordinator+) */}
          {canMatch() && (
            <AnimatePresence mode="wait">
              {confirmDecline ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-xs text-slate-400">Decline & rematch?</span>
                  <button
                    onClick={() => setConfirmDecline(false)}
                    className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-white/[0.07] transition-colors"
                  >
                    No
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onDecline(assignment.id); setConfirmDecline(false); }}
                    disabled={isDeclining}
                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-600/80 hover:bg-red-500 text-white transition-colors flex items-center gap-1"
                  >
                    {isDeclining ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-3 h-3 border border-red-300/30 border-t-red-300 rounded-full" />
                    ) : "Yes, decline"}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="idle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setConfirmDecline(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>
                  Decline
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}