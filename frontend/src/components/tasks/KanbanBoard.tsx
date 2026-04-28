"use client";
// ─────────────────────────────────────────────────────────────
//  components/tasks/KanbanBoard.tsx
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { KanbanColumn } from "./KanbanColumn";
import { cn } from "@/lib/utils";
import { KANBAN_COLUMNS } from "@/store/tasksStore";
import type { Task, TaskStatus } from "@/types/api.types";

interface KanbanBoardProps {
  byStatus: Record<TaskStatus, Task[]>;
  isLoading: boolean;
  dispatchingId: string | null;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDispatch: (id: string) => Promise<void>;
  onCardClick: (task: Task) => void;
}

export function KanbanBoard({
  byStatus, isLoading, dispatchingId,
  onStatusChange, onDispatch, onCardClick,
}: KanbanBoardProps) {
  const total     = KANBAN_COLUMNS.reduce((s, c) => s + (byStatus[c.id]?.length ?? 0), 0);
  const completed = byStatus.completed?.length ?? 0;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Progress summary bar */}
      {!isLoading && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Deployment progress</span>
              <span className="text-xs font-mono text-slate-300">
                {completed}/{total} completed
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              />
            </div>
          </div>

          {/* Column mini-counts */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col.id} className="flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full",
                  col.id === "notified"    ? "bg-sky-400"     :
                  col.id === "accepted"    ? "bg-violet-400"  :
                  col.id === "in_progress" ? "bg-amber-400"   : "bg-emerald-400"
                )} />
                <span className="text-xs text-slate-500 font-mono">
                  {byStatus[col.id]?.length ?? 0}
                </span>
              </div>
            ))}
          </div>

          {/* Completion badge */}
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-bold font-mono shrink-0",
            pct === 100 ? "bg-emerald-500/20 text-emerald-300"
              : pct > 50 ? "bg-amber-500/20 text-amber-300"
              : "bg-slate-500/20 text-slate-400"
          )}>
            {pct}%
          </div>
        </motion.div>
      )}

      {/* 4-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={byStatus[col.id] ?? []}
            isLoading={isLoading}
            dispatchingId={dispatchingId}
            onStatusChange={onStatusChange}
            onDispatch={onDispatch}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}