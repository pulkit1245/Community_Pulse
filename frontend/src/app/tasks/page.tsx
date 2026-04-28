"use client";
// ─────────────────────────────────────────────────────────────
//  app/tasks/page.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell }         from "@/components/layout/AppShell";
import { KanbanBoard }      from "@/components/tasks/KanbanBoard";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { useTasks }         from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/api.types";

export default function TasksPage() {
  const {
    byStatus, isLoading, dispatchingId,
    updateStatus, dispatchTask, refresh,
  } = useTasks();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const totalActive = (byStatus.notified?.length ?? 0)
    + (byStatus.accepted?.length ?? 0)
    + (byStatus.in_progress?.length ?? 0);

  return (
    <AppShell title="Deployment Kanban">
      {/* Page actions bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                totalActive > 0 ? "bg-amber-400" : "bg-emerald-400"
              )}
            />
            <span className="text-xs text-slate-400 font-mono">
              {totalActive > 0 ? `${totalActive} active` : "All clear"}
            </span>
          </div>

          <span className="text-xs text-slate-600">
            {(byStatus.completed?.length ?? 0)} completed
          </span>
        </div>

        {/* Refresh button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isLoading || refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 border border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.04] transition-all"
        >
          <motion.svg
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: "linear" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </motion.svg>
          Refresh
        </motion.button>
      </div>

      {/* Kanban board */}
      <KanbanBoard
        byStatus={byStatus}
        isLoading={isLoading}
        dispatchingId={dispatchingId}
        onStatusChange={updateStatus}
        onDispatch={dispatchTask}
        onCardClick={setSelectedTask}
      />

      {/* Task detail drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={async (id, status) => {
          await updateStatus(id, status);
          // Update selectedTask locally so drawer reflects the change instantly
          setSelectedTask((t) => t && t.id === id ? { ...t, status } : t);
        }}
        onDispatch={async (id) => {
          await dispatchTask(id);
          setSelectedTask((t) => t && t.id === id ? { ...t, status: "notified" } : t);
        }}
        isDispatching={!!(selectedTask && dispatchingId === selectedTask.id)}
      />
    </AppShell>
  );
}