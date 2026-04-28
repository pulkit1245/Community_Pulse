"use client";
// ─────────────────────────────────────────────────────────────
//  components/match/MatchScoreBreakdown.tsx
//  Visualises the three match-weight components:
//    skill_match × 0.45 + proximity × 0.30 + availability × 0.25
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatchScoreBreakdownProps {
  /** Overall 0–100 match score */
  score: number;
  /** Individual component scores 0–1 (will be derived if not provided) */
  skillScore?:        number;
  proximityScore?:    number;
  availabilityScore?: number;
  compact?: boolean;
}

interface WeightRow {
  label:  string;
  weight: number;
  value:  number;
  color:  string;
  track:  string;
}

// Reverse-engineer component values from total score
// score = (skill × 0.45 + proximity × 0.30 + availability × 0.25) × 100
function deriveComponents(score: number): { skill: number; proximity: number; availability: number } {
  // Heuristic split: assume equal-ratio split scaled proportionally
  const ratio = score / 100;
  return {
    skill:        Math.min(1, ratio * 1.1),
    proximity:    Math.min(1, ratio * 0.95),
    availability: Math.min(1, ratio * 1.0),
  };
}

export function MatchScoreBreakdown({
  score,
  skillScore,
  proximityScore,
  availabilityScore,
  compact = false,
}: MatchScoreBreakdownProps) {
  const derived      = deriveComponents(score);
  const skill        = skillScore        ?? derived.skill;
  const proximity    = proximityScore    ?? derived.proximity;
  const availability = availabilityScore ?? derived.availability;

  const rows: WeightRow[] = [
    {
      label:  "Skill Match",
      weight: 0.45,
      value:  skill,
      color:  "bg-violet-400",
      track:  "bg-violet-400/20",
    },
    {
      label:  "Proximity",
      weight: 0.30,
      value:  proximity,
      color:  "bg-sky-400",
      track:  "bg-sky-400/20",
    },
    {
      label:  "Availability",
      weight: 0.25,
      value:  availability,
      color:  "bg-emerald-400",
      track:  "bg-emerald-400/20",
    },
  ];

  // Overall score colour
  const scoreColor =
    score >= 80 ? "#34d399" :
    score >= 55 ? "#fbbf24" : "#f87171";

  return (
    <div className={cn("space-y-2", compact ? "" : "space-y-3")}>
      {/* Circular score badge */}
      {!compact && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              {/* Track */}
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
              {/* Progress */}
              <motion.circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke={scoreColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - score / 100) }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold font-mono" style={{ color: scoreColor }}>
                {score}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">Match Score</p>
            <p className="text-xs text-slate-500">
              {score >= 80 ? "Excellent fit" : score >= 55 ? "Good fit" : "Partial fit"}
            </p>
          </div>
        </div>
      )}

      {/* Weight bars */}
      {rows.map((row, i) => {
        const contribution = Math.round(row.value * row.weight * 100);
        return (
          <div key={row.label} className={compact ? "" : ""}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={cn("w-1.5 h-1.5 rounded-full", row.color)} />
                <span className={cn(
                  "text-slate-400",
                  compact ? "text-[10px]" : "text-xs"
                )}>
                  {row.label}
                </span>
                <span className={cn(
                  "text-slate-600 font-mono",
                  compact ? "text-[9px]" : "text-[10px]"
                )}>
                  ×{row.weight}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!compact && (
                  <span className="text-[10px] text-slate-600 font-mono">
                    {Math.round(row.value * 100)}%
                  </span>
                )}
                <span className={cn(
                  "font-mono font-semibold",
                  compact ? "text-[10px]" : "text-xs",
                  row.value >= 0.8 ? "text-emerald-400" :
                  row.value >= 0.5 ? "text-amber-400"   : "text-red-400"
                )}>
                  +{contribution}
                </span>
              </div>
            </div>

            <div className={cn("w-full rounded-full overflow-hidden", compact ? "h-1" : "h-1.5", row.track)}>
              <motion.div
                className={cn("h-full rounded-full", row.color)}
                initial={{ width: 0 }}
                animate={{ width: `${row.value * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.1 + 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        );
      })}

      {/* Formula hint */}
      {!compact && (
        <p className="text-[10px] text-slate-600 font-mono pt-1">
          skill×0.45 + proximity×0.30 + availability×0.25
        </p>
      )}
    </div>
  );
}