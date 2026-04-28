"use client";
// ─────────────────────────────────────────────────────────────
//  components/tasks/KanbanColumn.tsx
// ─────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/api.types";

interface KanbanColumnConfig {
  id: TaskStatus;
  label: string;
  color: string;   // border color class
  accent: string;  // badge bg+text classes
}

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  tasks: Task[];
  isLoading: boolean;
  dispatchingId: string | null;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDispatch: (id: string) => Promise<void>;
  onCardClick: (task: Task) => void;
}

// Skeleton loading card
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-4 w-20 rounded-full bg-white/[0.08]" />
        <div className="h-4 w-12 rounded-full bg-white/[0.05]" />
      </div>
      <div className="h-3 w-16 rounded-full bg-white/[0.06]" />
      <div className="h-10 rounded-lg bg-white/[0.05]" />
      <div className="flex justify-between">
        <div className="h-3 w-24 rounded-full bg-white/[0.05]" />
        <div className="h-6 w-16 rounded-lg bg-white/[0.07]" />
      </div>
    </div>
  );
}

export function KanbanColumn({
  column, tasks, isLoading,
  dispatchingId, onStatusChange, onDispatch, onCardClick,
}: KanbanColumnProps) {
  return (
    <div className={cn(
      "flex flex-col rounded-2xl border bg-white/[0.02] min-h-[calc(100vh-200px)]",
      column.color
    )}>
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", column.accent)}>
            {column.label}
          </span>
        </div>
        <motion.span
          key={tasks.length}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs font-mono font-bold text-slate-400 w-5 h-5 rounded-full bg-white/[0.07] flex items-center justify-center"
        >
          {tasks.length}
        </motion.span>
      </div>

      {/* Cards area */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {isLoading ? (
          // Show 2 skeletons per column while loading
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/[0.1] flex items-center justify-center mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <p className="text-xs text-slate-600">No tasks</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <KanbanCard
                  task={task}
                  onStatusChange={onStatusChange}
                  onDispatch={onDispatch}
                  isDispatching={dispatchingId === task.id}
                  onClick={() => onCardClick(task)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}