"use client";
// ─────────────────────────────────────────────────────────────
//  components/ui/Badges.tsx
//  UrgencyBadge · StatusPill · ZoneBadge · StatCard
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { cn, urgencyColors, taskStatusConfig, capitalize } from "@/lib/utils";
import type { UrgencyLabel } from "@/types/api.types";

// ── UrgencyBadge ──────────────────────────────────────────────

interface UrgencyBadgeProps {
  label: UrgencyLabel;
  score?: number;
  className?: string;
}

export function UrgencyBadge({ label, score, className }: UrgencyBadgeProps) {
  const c = urgencyColors(label);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        c.bg, c.text, c.border, className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      {label.charAt(0).toUpperCase() + label.slice(1)}
      {score !== undefined && (
        <span className="opacity-60 font-mono">{score}</span>
      )}
    </span>
  );
}

// ── StatusPill ────────────────────────────────────────────────

interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const c = taskStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        c.bg, c.color, className
      )}
    >
      {c.label}
    </span>
  );
}

// ── ZoneBadge ─────────────────────────────────────────────────

interface ZoneBadgeProps {
  zone: string;
  className?: string;
}

export function ZoneBadge({ zone, className }: ZoneBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono",
        "bg-slate-700/60 text-slate-300 border border-slate-600/40",
        className
      )}
    >
      {zone}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accent?: "sky" | "red" | "amber" | "emerald" | "violet";
  icon?: React.ReactNode;
  className?: string;
}

const accentMap = {
  sky:     { icon: "bg-sky-500/15 text-sky-400",     value: "text-sky-300" },
  red:     { icon: "bg-red-500/15 text-red-400",     value: "text-red-300" },
  amber:   { icon: "bg-amber-500/15 text-amber-400", value: "text-amber-300" },
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", value: "text-emerald-300" },
  violet:  { icon: "bg-violet-500/15 text-violet-400",  value: "text-violet-300" },
};

export function StatCard({
  label,
  value,
  sub,
  trend,
  trendValue,
  accent = "sky",
  icon,
  className,
}: StatCardProps) {
  const a = accentMap[accent];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5",
        "hover:border-white/[0.12] hover:bg-white/[0.06] transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
          {label}
        </p>
        {icon && (
          <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", a.icon)}>
            {icon}
          </span>
        )}
      </div>

      <p className={cn("text-3xl font-bold tabular-nums leading-none mb-1", a.value)}
         style={{ fontFamily: "'DM Mono', monospace" }}>
        {value}
      </p>

      {(sub || trendValue) && (
        <div className="flex items-center gap-2 mt-2">
          {trendValue && (
            <span className={cn(
              "text-xs font-medium",
              trend === "up"   ? "text-emerald-400" :
              trend === "down" ? "text-red-400"     : "text-slate-400"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
          {sub && <span className="text-xs text-slate-500">{sub}</span>}
        </div>
      )}
    </motion.div>
  );
}

// ── SkeletonCard (loading state) ──────────────────────────────

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 animate-pulse", className)}>
      <div className="h-3 w-20 rounded bg-white/10 mb-4" />
      <div className="h-8 w-16 rounded bg-white/10 mb-2" />
      <div className="h-3 w-24 rounded bg-white/10" />
    </div>
  );
}