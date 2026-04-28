"use client";
// ─────────────────────────────────────────────────────────────
//  components/needs/NeedFiltersBar.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { NeedFilters, UrgencyLabel, NeedStatus, NeedType } from "@/types/api.types";

interface NeedFiltersBarProps {
  filters: NeedFilters;
  total: number;
  onFilter: (f: Partial<NeedFilters>) => void;
  onIngestOpen: () => void;
}

const URGENCY_OPTIONS: { label: string; value: UrgencyLabel | "" }[] = [
  { label: "All urgency", value: "" },
  { label: "Critical",    value: "critical" },
  { label: "Moderate",    value: "moderate" },
  { label: "Low",         value: "low" },
];

const STATUS_OPTIONS: { label: string; value: NeedStatus | "" }[] = [
  { label: "All status",  value: "" },
  { label: "Unmatched",   value: "unmatched" },
  { label: "Matched",     value: "matched" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed",   value: "completed" },
];

const NEED_TYPES: NeedType[] = [
  "food","medical","water","shelter","elderly_care",
  "child_welfare","education","mental_health","livelihood",
  "disability","legal","supplies",
];

const URGENCY_PILL_COLORS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  moderate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function NeedFiltersBar({
  filters, total, onFilter, onIngestOpen,
}: NeedFiltersBarProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  function submitSearch(val: string) {
    onFilter({ search: val || undefined });
  }

  const activeCount = [
    filters.urgency_label, filters.status, filters.type,
    filters.zone, filters.search,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 mb-5">
      {/* Top row — search + ingest button */}
      <div className="flex gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch(search)}
            onBlur={() => submitSearch(search)}
            placeholder="Search needs…"
            className={cn(
              "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm",
              "bg-white/[0.05] border border-white/[0.08] text-slate-200 placeholder-slate-600",
              "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Count badge */}
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {total} result{total !== 1 ? "s" : ""}
        </span>

        {/* Clear filters */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => {
                setSearch("");
                onFilter({
                  search: undefined, urgency_label: undefined,
                  status: undefined, zone: undefined, type: undefined,
                });
              }}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Clear {activeCount}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Ingest button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onIngestOpen}
          className={cn(
            "ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold",
            "bg-sky-600 hover:bg-sky-500 text-white transition-colors",
            "shadow-[0_0_16px_rgba(14,165,233,0.2)]"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Ingest Need
        </motion.button>
      </div>

      {/* Filter pills row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Urgency filter */}
        {URGENCY_OPTIONS.map(({ label, value }) => {
          const active = (filters.urgency_label ?? "") === value;
          return (
            <button
              key={label}
              onClick={() => onFilter({ urgency_label: value || undefined })}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                active && value
                  ? URGENCY_PILL_COLORS[value]
                  : active
                  ? "bg-white/[0.08] text-slate-200 border-white/[0.15]"
                  : "bg-transparent text-slate-500 border-white/[0.07] hover:border-white/[0.15] hover:text-slate-300"
              )}
            >
              {label}
            </button>
          );
        })}

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Status filter */}
        {STATUS_OPTIONS.map(({ label, value }) => {
          const active = (filters.status ?? "") === value;
          return (
            <button
              key={label}
              onClick={() => onFilter({ status: value || undefined })}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                active
                  ? "bg-white/[0.08] text-slate-200 border-white/[0.15]"
                  : "bg-transparent text-slate-500 border-white/[0.07] hover:border-white/[0.15] hover:text-slate-300"
              )}
            >
              {label}
            </button>
          );
        })}

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Type dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu((v) => !v)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 flex items-center gap-1",
              filters.type
                ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                : "bg-transparent text-slate-500 border-white/[0.07] hover:border-white/[0.15] hover:text-slate-300"
            )}
          >
            {filters.type ? filters.type.replace(/_/g, " ") : "Need type"}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          <AnimatePresence>
            {showTypeMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowTypeMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-8 left-0 z-40 w-52 rounded-xl border border-white/[0.1] bg-[#111827] shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => { onFilter({ type: undefined }); setShowTypeMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors"
                  >
                    All types
                  </button>
                  {NEED_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => { onFilter({ type: t }); setShowTypeMenu(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs transition-colors capitalize",
                        filters.type === t
                          ? "bg-sky-500/15 text-sky-300"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      )}
                    >
                      {t.replace(/_/g, " ")}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}