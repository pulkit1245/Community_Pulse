"use client";
// ─────────────────────────────────────────────────────────────
//  components/volunteers/VolunteersTable.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VolunteerAvatar, SkillBadge, AvailabilityIndicator, ReliabilityBar } from "./VolunteerPrimitives";
import { ZoneBadge } from "@/components/ui/Badges";
import { timeAgo, cn } from "@/lib/utils";
import type { Volunteer } from "@/types/api.types";

type SortKey = "name" | "reliability_score" | "zone" | "created_at";
type SortDir = "asc" | "desc";

interface VolunteersTableProps {
  volunteers: Volunteer[];
  isLoading: boolean;
  onSelect: (v: Volunteer) => void;
  onEdit:   (v: Volunteer) => void;
  canWrite: boolean;
}

export function VolunteersTable({ volunteers, isLoading, onSelect, onEdit, canWrite }: VolunteersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("reliability_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...volunteers].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name")              return mul * a.name.localeCompare(b.name);
    if (sortKey === "reliability_score") return mul * (a.reliability_score - b.reliability_score);
    if (sortKey === "zone")              return mul * a.zone.localeCompare(b.zone);
    if (sortKey === "created_at")        return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return 0;
  });

  function SortIcon({ k }: { k: SortKey }) {
    const active = sortKey === k;
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className={cn("ml-1 transition-all", active ? "text-sky-400 opacity-100" : "text-slate-600 opacity-50")}>
        {active && sortDir === "asc"
          ? <path d="M12 19V5M5 12l7-7 7 7"/>
          : <path d="M12 5v14M5 12l7 7 7-7"/>}
      </svg>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <div className="p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      </div>
    );
  }

  if (volunteers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] py-20 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300">No volunteers found</p>
        <p className="text-xs text-slate-500">Try adjusting filters or add a new volunteer</p>
      </div>
    );
  }

  const COLS: { label: string; key: SortKey | null; className?: string }[] = [
    { label: "Volunteer",   key: "name"              },
    { label: "Skills",      key: null                },
    { label: "Zone",        key: "zone"              },
    { label: "Reliability", key: "reliability_score" },
    { label: "Status",      key: null                },
    { label: "Joined",      key: "created_at"        },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {COLS.map(({ label, key }) => (
                <th
                  key={label}
                  onClick={() => key && handleSort(key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-mono whitespace-nowrap",
                    key && "cursor-pointer hover:text-slate-300 select-none"
                  )}
                >
                  <span className="flex items-center">
                    {label}
                    {key && <SortIcon k={key} />}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {sorted.map((vol, i) => (
                <motion.tr
                  key={vol.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors group cursor-pointer"
                  onClick={() => onSelect(vol)}
                >
                  {/* Volunteer identity */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <VolunteerAvatar name={vol.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{vol.name}</p>
                        <p className="text-xs text-slate-500 truncate">{vol.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Skills */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {vol.skills.slice(0, 3).map((s) => (
                        <SkillBadge key={s} skill={s} size="sm" />
                      ))}
                      {vol.skills.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                          +{vol.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Zone */}
                  <td className="px-4 py-3.5">
                    <ZoneBadge zone={vol.zone} />
                  </td>

                  {/* Reliability */}
                  <td className="px-4 py-3.5">
                    <div className="w-24">
                      <ReliabilityBar score={vol.reliability_score} />
                    </div>
                  </td>

                  {/* Availability */}
                  <td className="px-4 py-3.5">
                    <AvailabilityIndicator available={vol.available} />
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-500 font-mono">{timeAgo(vol.created_at)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canWrite && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); onEdit(vol); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                          title="Edit volunteer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </motion.button>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onSelect(vol); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
                        title="View details"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}