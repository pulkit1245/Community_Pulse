"use client";
// components/volunteers/VolunteerFiltersBar.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SkillType } from "@/types/api.types";
import type { VolunteerFilters } from "@/lib/api/volunteers.service";

interface VolunteerFiltersBarProps {
  filters: VolunteerFilters;
  total: number;
  onFilter: (f: Partial<VolunteerFilters>) => void;
  onCreateOpen: () => void;
}

const SKILLS: SkillType[] = [
  "medical", "logistics", "food_distribution", "water_safety",
  "construction", "social_work", "teaching", "counselling", "legal", "general",
];

const ZONES = ["ward1", "ward2", "ward3", "ward4", "ward5", "ward6"];

export function VolunteerFiltersBar({
  filters, total, onFilter, onCreateOpen,
}: VolunteerFiltersBarProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [showZoneMenu, setShowZoneMenu]   = useState(false);

  function submitSearch(val: string) {
    onFilter({ search: val || undefined });
  }

  const activeCount = [
    filters.available !== undefined ? "avail" : null,
    filters.zone,
    filters.skill,
    filters.search,
  ].filter(Boolean).length;

  function clearAll() {
    setSearch("");
    onFilter({ search: undefined, available: undefined, zone: undefined, skill: undefined });
  }

  return (
    <div className="space-y-3 mb-5">
      {/* Row 1 — search + create */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch(search)}
            onBlur={() => submitSearch(search)}
            placeholder="Search volunteers…"
            className={cn(
              "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm",
              "bg-white/[0.05] border border-white/[0.08] text-slate-200 placeholder-slate-600",
              "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all"
            )}
          />
        </div>

        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {total} volunteer{total !== 1 ? "s" : ""}
        </span>

        <AnimatePresence>
          {activeCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Clear {activeCount}
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCreateOpen}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-[0_0_16px_rgba(16,185,129,0.2)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Volunteer
        </motion.button>
      </div>

      {/* Row 2 — filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Availability toggle */}
        {[
          { label: "All",         value: undefined   },
          { label: "Available",   value: true        },
          { label: "Unavailable", value: false       },
        ].map(({ label, value }) => {
          const active = filters.available === value;
          return (
            <button key={label} onClick={() => onFilter({ available: value })}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                active
                  ? value === true  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : value === false ? "bg-slate-500/15 text-slate-400 border-slate-500/30"
                    : "bg-white/[0.08] text-slate-200 border-white/[0.15]"
                  : "bg-transparent text-slate-500 border-white/[0.07] hover:border-white/[0.15] hover:text-slate-300"
              )}
            >
              {label}
            </button>
          );
        })}

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Zone dropdown */}
        <div className="relative">
          <button onClick={() => setShowZoneMenu((v) => !v)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1",
              filters.zone
                ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                : "bg-transparent text-slate-500 border-white/[0.07] hover:border-white/[0.15] hover:text-slate-300"
            )}
          >
            {filters.zone ?? "Zone"}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <AnimatePresence>
            {showZoneMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowZoneMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-8 left-0 z-40 w-36 rounded-xl border border-white/[0.1] bg-[#111827] shadow-xl overflow-hidden"
                >
                  <button onClick={() => { onFilter({ zone: undefined }); setShowZoneMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors">
                    All zones
                  </button>
                  {ZONES.map((z) => (
                    <button key={z} onClick={() => { onFilter({ zone: z }); setShowZoneMenu(false); }}
                      className={cn("w-full text-left px-3 py-2 text-xs transition-colors font-mono capitalize",
                        filters.zone === z ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200")}>
                      {z}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Skill dropdown */}
        <div className="relative">
          <button onClick={() => setShowSkillMenu((v) => !v)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1",
              filters.skill
                ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
                : "bg-transparent text-slate-500 border-white/[0.07] hover:border-white/[0.15] hover:text-slate-300"
            )}
          >
            {filters.skill ? filters.skill.replace(/_/g, " ") : "Skill"}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <AnimatePresence>
            {showSkillMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSkillMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-8 left-0 z-40 w-52 rounded-xl border border-white/[0.1] bg-[#111827] shadow-xl overflow-hidden"
                >
                  <button onClick={() => { onFilter({ skill: undefined }); setShowSkillMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors">
                    All skills
                  </button>
                  {SKILLS.map((s) => (
                    <button key={s} onClick={() => { onFilter({ skill: s }); setShowSkillMenu(false); }}
                      className={cn("w-full text-left px-3 py-2 text-xs transition-colors capitalize",
                        filters.skill === s ? "bg-violet-500/15 text-violet-300" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200")}>
                      {s.replace(/_/g, " ")}
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