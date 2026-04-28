"use client";
// ─────────────────────────────────────────────────────────────
//  components/needs/NeedsTable.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, ZoneBadge, StatusPill } from "@/components/ui/Badges";
import { timeAgo, capitalize, cn } from "@/lib/utils";
import type { Need } from "@/types/api.types";

type SortKey = "urgency_score" | "count" | "created_at" | "type";
type SortDir = "asc" | "desc";

interface NeedsTableProps {
  needs: Need[];
  isLoading: boolean;
  onSelect: (need: Need) => void;
}

const SOURCE_ICON: Record<string, React.ReactNode> = {
  whatsapp_voice: (
    <span className="inline-flex items-center gap-1 text-emerald-400">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.976 0C5.368 0 0 5.368 0 11.976c0 2.104.549 4.07 1.509 5.776L.07 23.43c-.1.374.252.727.626.627l5.774-1.511A11.947 11.947 0 0011.976 24C18.584 24 24 18.632 24 12.024 24 5.368 18.584 0 11.976 0zm0 21.818a9.836 9.836 0 01-5.028-1.375l-.36-.214-3.728.977.994-3.641-.236-.376A9.808 9.808 0 012.182 12.024c0-5.404 4.39-9.842 9.794-9.842 5.404 0 9.842 4.438 9.842 9.842 0 5.356-4.438 9.794-9.842 9.794z"/></svg>
      WA
    </span>
  ),
  sms: <span className="text-amber-400 text-xs">SMS</span>,
  rest: <span className="text-sky-400 text-xs">API</span>,
  ocr:  <span className="text-violet-400 text-xs">OCR</span>,
  manual: <span className="text-slate-400 text-xs">Manual</span>,
};

export function NeedsTable({ needs, isLoading, onSelect }: NeedsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("urgency_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...needs].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "urgency_score") return mul * (a.urgency_score - b.urgency_score);
    if (sortKey === "count")         return mul * (a.count - b.count);
    if (sortKey === "created_at")    return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortKey === "type")          return mul * a.type.localeCompare(b.type);
    return 0;
  });

  const SortIcon = ({ k }: { k: SortKey }) => (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn(
        "ml-1 transition-all duration-150",
        sortKey === k ? "text-sky-400 opacity-100" : "text-slate-600 opacity-60"
      )}
    >
      {sortKey === k && sortDir === "asc"
        ? <path d="M12 19V5M5 12l7-7 7 7"/>
        : <path d="M12 5v14M5 12l7 7 7-7"/>}
    </svg>
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <div className="p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-white/[0.04] animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      </div>
    );
  }

  if (needs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] py-20 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300">No needs found</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {[
                { label: "Type",    key: "type"          as SortKey },
                { label: "Urgency", key: "urgency_score" as SortKey },
                { label: "Zone",    key: null },
                { label: "Count",   key: "count"         as SortKey },
                { label: "Skill",   key: null },
                { label: "Source",  key: null },
                { label: "Status",  key: null },
                { label: "Created", key: "created_at"    as SortKey },
              ].map(({ label, key }) => (
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
              {/* Actions col */}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sorted.map((need, i) => (
                <motion.tr
                  key={need.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onSelect(need)}
                  className={cn(
                    "border-b border-white/[0.04] cursor-pointer transition-colors group",
                    "hover:bg-white/[0.04]",
                    need.urgency_label === "critical" && "hover:bg-red-500/[0.04]"
                  )}
                >
                  {/* Type */}
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-slate-200">{capitalize(need.type)}</span>
                  </td>

                  {/* Urgency */}
                  <td className="px-4 py-3.5">
                    <UrgencyBadge label={need.urgency_label} score={need.urgency_score} />
                  </td>

                  {/* Zone */}
                  <td className="px-4 py-3.5">
                    <ZoneBadge zone={need.zone} />
                  </td>

                  {/* Count */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-slate-300">{need.count}</span>
                    <span className="text-slate-600 text-xs ml-1">people</span>
                  </td>

                  {/* Required skill */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400 capitalize">
                      {need.required_skill.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3.5">
                    {SOURCE_ICON[need.source] ?? <span className="text-xs text-slate-500">{need.source}</span>}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusPill status={need.status} />
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-500 font-mono">{timeAgo(need.created_at)}</span>
                  </td>

                  {/* Chevron */}
                  <td className="px-4 py-3.5">
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-slate-600 group-hover:text-slate-400 transition-colors"
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
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