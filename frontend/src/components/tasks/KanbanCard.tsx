"use client";
// ─────────────────────────────────────────────────────────────
//  components/tasks/KanbanCard.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, ZoneBadge } from "@/components/ui/Badges";
import { VolunteerAvatar } from "@/components/volunteers/VolunteerPrimitives";
import { timeAgo, capitalize, cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/api.types";
import { KANBAN_COLUMNS } from "@/store/tasksStore";
import { useAuthStore } from "@/store/authStore";

interface KanbanCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDispatch: (id: string) => Promise<void>;
  isDispatching: boolean;
  onClick: () => void;
}

const SOURCE_ICONS: Record<string, string> = {
  whatsapp_voice: "WA",
  sms: "SMS",
  rest: "API",
  ocr: "OCR",
  manual: "MNL",
};

export function KanbanCard({
  task, onStatusChange, onDispatch, isDispatching, onClick,
}: KanbanCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { canDispatch } = useAuthStore();

  const currentColIndex = KANBAN_COLUMNS.findIndex((c) => c.id === task.status);
  const nextCol = KANBAN_COLUMNS[currentColIndex + 1];
  const prevCol = KANBAN_COLUMNS[currentColIndex - 1];

  const urgency = task.need?.urgency_label ?? "low";
  const urgencyBorder = urgency === "critical" ? "border-red-500/20"
    : urgency === "moderate" ? "border-amber-500/20"
    : "border-white/[0.07]";

  return (
    <motion.div
      layout
      layoutId={`task-${task.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-xl border bg-white/[0.04] hover:bg-white/[0.06] transition-colors cursor-pointer group",
        "relative overflow-hidden",
        urgencyBorder
      )}
      onClick={onClick}
    >
      {/* Critical urgency top stripe */}
      {urgency === "critical" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/60 via-red-400/80 to-red-500/60" />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-slate-200 capitalize">
                {task.need ? capitalize(task.need.type) : "Unknown Need"}
              </span>
              {task.need && <ZoneBadge zone={task.need.zone} />}
            </div>
            {task.need && (
              <div className="flex items-center gap-2">
                <UrgencyBadge label={task.need.urgency_label} score={task.need.urgency_score} />
                <span className="text-xs text-slate-600">
                  {SOURCE_ICONS[task.need.source] ?? task.need.source}
                </span>
              </div>
            )}
          </div>

          {/* Overflow menu */}
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/[0.08] transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5"  r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-7 z-30 w-44 rounded-xl border border-white/[0.1] bg-[#111827] shadow-xl overflow-hidden"
                  >
                    {/* Move backward */}
                    {prevCol && (
                      <button
                        onClick={() => { onStatusChange(task.id, prevCol.id); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors flex items-center gap-2"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 12H5M12 5l-7 7 7 7"/>
                        </svg>
                        Move to {prevCol.label}
                      </button>
                    )}
                    {/* Move forward */}
                    {nextCol && (
                      <button
                        onClick={() => { onStatusChange(task.id, nextCol.id); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors flex items-center gap-2"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                        Move to {nextCol.label}
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* People count */}
        {task.need && (
          <div className="flex items-center gap-1 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/>
            </svg>
            <span className="text-xs text-slate-500">
              <span className="font-mono text-slate-300">{task.need.count}</span> {task.need.count === 1 ? "person" : "people"}
            </span>
            <span className="text-slate-700 mx-1">·</span>
            <span className="text-xs text-slate-500 capitalize">{task.need.required_skill?.replace(/_/g, " ")}</span>
          </div>
        )}

        {/* Volunteer row */}
        {task.volunteer && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.05] mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <VolunteerAvatar name={task.volunteer.name} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{task.volunteer.name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{task.volunteer.zone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Reliability dot */}
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: task.volunteer.reliability_score >= 80 ? "#34d399"
                    : task.volunteer.reliability_score >= 50 ? "#fbbf24" : "#f87171",
                }}
              />
              <span className="text-[10px] text-slate-500 font-mono">{task.volunteer.reliability_score}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-600 font-mono">
            {task.dispatched_at
              ? `Dispatched ${timeAgo(task.dispatched_at)}`
              : task.need
              ? timeAgo(task.need.created_at)
              : "—"}
          </span>

          {/* Dispatch button — only for notified tasks */}
          {task.status === "notified" && canDispatch() && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onDispatch(task.id); }}
              disabled={isDispatching}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                isDispatching
                  ? "bg-sky-500/20 text-sky-300/50 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_8px_rgba(14,165,233,0.25)]"
              )}
            >
              {isDispatching ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-3 h-3 border border-sky-300/30 border-t-sky-300 rounded-full"
                />
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              )}
              {isDispatching ? "Sending…" : "Dispatch"}
            </motion.button>
          )}

          {/* Advance status quick-action */}
          {task.status !== "completed" && task.status !== "notified" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); if (nextCol) onStatusChange(task.id, nextCol.id); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] border border-transparent hover:border-white/[0.08] transition-all"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              {nextCol?.label ?? ""}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}