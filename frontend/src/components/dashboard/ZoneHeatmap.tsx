"use client";
// components/dashboard/ZoneHeatmap.tsx
// SVG-based zone heatmap (Leaflet loads client-side; this provides
// an always-SSR-safe fallback that also works great for the demo).

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ZoneData } from "@/types/api.types";

interface ZoneHeatmapProps {
  zones: ZoneData[];
  isLoading: boolean;
}

function needColor(score: number): string {
  if (score >= 70) return "#ef4444"; // critical red
  if (score >= 40) return "#f59e0b"; // moderate amber
  return "#22c55e";                   // low green
}

function needLabel(score: number): string {
  if (score >= 70) return "Critical";
  if (score >= 40) return "Moderate";
  return "Covered";
}

export function ZoneHeatmap({ zones, isLoading }: ZoneHeatmapProps) {
  const [hovered, setHovered] = useState<ZoneData | null>(null);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-sm font-semibold text-white">Zone Heatmap</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated need intensity by zone</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {[["#ef4444","Critical"],["#f59e0b","Moderate"],["#22c55e","Covered"]].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: c }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 relative">
        {isLoading ? (
          <div className="h-48 rounded-xl bg-white/[0.04] animate-pulse" />
        ) : zones.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No zone data</div>
        ) : (
          <>
            {/* Bubble grid */}
            <div className="grid grid-cols-3 gap-3">
              {zones.map((zone, i) => {
                const color = needColor(zone.need_score);
                const size  = Math.max(60, Math.min(100, 60 + zone.need_score * 0.4));
                return (
                  <motion.div
                    key={zone.zone_id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    onHoverStart={() => setHovered(zone)}
                    onHoverEnd={() => setHovered(null)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ scale: 1.12 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-full flex items-center justify-center border-2 relative"
                      style={{
                        width: size, height: size,
                        borderColor: color,
                        background: `${color}18`,
                        boxShadow: `0 0 ${zone.need_score >= 70 ? 20 : 8}px ${color}40`,
                      }}
                    >
                      {/* Pulse ring for critical */}
                      {zone.need_score >= 70 && (
                        <motion.div
                          className="absolute rounded-full border"
                          style={{ borderColor: color, width: size + 8, height: size + 8 }}
                          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {zone.need_score}
                      </span>
                    </motion.div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-300 truncate max-w-[80px]">{zone.name}</p>
                      <p className="text-[10px] font-mono" style={{ color }}>{needLabel(zone.need_score)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Tooltip */}
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/[0.1] bg-[#111827] px-4 py-3 pointer-events-none"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{hovered.name}</span>
                  <span className="text-xs font-mono" style={{ color: needColor(hovered.need_score) }}>
                    Score: {hovered.need_score}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span><span className="text-red-400 font-mono">{hovered.critical_count}</span> critical</span>
                  <span><span className="text-amber-400 font-mono">{hovered.moderate_count}</span> moderate</span>
                  <span><span className="text-emerald-400 font-mono">{hovered.low_count}</span> low</span>
                  <span><span className="text-sky-400 font-mono">{hovered.volunteer_count}</span> volunteers</span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}