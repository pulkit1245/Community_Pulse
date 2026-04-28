"use client";
// ─────────────────────────────────────────────────────────────
//  components/volunteers/VolunteerPrimitives.tsx
//  SkillBadge · AvailabilityIndicator · ReliabilityBar · Avatar
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SkillType } from "@/types/api.types";

// ── Skill colour map ──────────────────────────────────────────
const SKILL_COLORS: Record<SkillType, { bg: string; text: string; border: string }> = {
  medical:           { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/25"     },
  logistics:         { bg: "bg-sky-500/15",     text: "text-sky-400",     border: "border-sky-500/25"     },
  food_distribution: { bg: "bg-orange-500/15",  text: "text-orange-400",  border: "border-orange-500/25"  },
  water_safety:      { bg: "bg-cyan-500/15",    text: "text-cyan-400",    border: "border-cyan-500/25"    },
  construction:      { bg: "bg-yellow-500/15",  text: "text-yellow-400",  border: "border-yellow-500/25"  },
  social_work:       { bg: "bg-violet-500/15",  text: "text-violet-400",  border: "border-violet-500/25"  },
  teaching:          { bg: "bg-indigo-500/15",  text: "text-indigo-400",  border: "border-indigo-500/25"  },
  counselling:       { bg: "bg-pink-500/15",    text: "text-pink-400",    border: "border-pink-500/25"    },
  legal:             { bg: "bg-slate-500/15",   text: "text-slate-400",   border: "border-slate-500/25"   },
  general:           { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
};

// ── SkillBadge ────────────────────────────────────────────────

interface SkillBadgeProps {
  skill: SkillType;
  size?: "sm" | "md";
  className?: string;
}

export function SkillBadge({ skill, size = "sm", className }: SkillBadgeProps) {
  const c = SKILL_COLORS[skill] ?? SKILL_COLORS.general;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        c.bg, c.text, c.border,
        className
      )}
    >
      {skill.replace(/_/g, "\u00a0")}
    </span>
  );
}

// ── AvailabilityIndicator ─────────────────────────────────────

interface AvailabilityProps {
  available: boolean;
  showLabel?: boolean;
  className?: string;
}

export function AvailabilityIndicator({ available, showLabel = true, className }: AvailabilityProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex items-center justify-center w-2 h-2">
        {available && (
          <motion.span
            animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-full h-full rounded-full bg-emerald-400"
          />
        )}
        <span className={cn(
          "relative w-2 h-2 rounded-full",
          available ? "bg-emerald-400" : "bg-slate-600"
        )} />
      </span>
      {showLabel && (
        <span className={cn(
          "text-xs font-medium",
          available ? "text-emerald-400" : "text-slate-500"
        )}>
          {available ? "Available" : "Unavailable"}
        </span>
      )}
    </span>
  );
}

// ── ReliabilityBar ────────────────────────────────────────────

interface ReliabilityBarProps {
  score: number; // 0–100
  showLabel?: boolean;
  className?: string;
}

export function ReliabilityBar({ score, showLabel = true, className }: ReliabilityBarProps) {
  const color =
    score >= 80 ? "#34d399" :
    score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono shrink-0" style={{ color }}>
          {score}
        </span>
      )}
    </div>
  );
}

// ── VolunteerAvatar ───────────────────────────────────────────

const AVATAR_COLORS = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VolunteerAvatar({ name, size = "md", className }: AvatarProps) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  }[size];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br shrink-0",
        sizeClasses,
        AVATAR_COLORS[idx],
        className
      )}
    >
      {initials}
    </div>
  );
}