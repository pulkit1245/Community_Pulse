"use client";
// ─────────────────────────────────────────────────────────────
//  components/tasks/TaskDetailDrawer.tsx
// ─────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, ZoneBadge, StatusPill } from "@/components/ui/Badges";
import { VolunteerAvatar, SkillBadge, ReliabilityBar, AvailabilityIndicator } from "@/components/volunteers/VolunteerPrimitives";
import { timeAgo, capitalize, cn } from "@/lib/utils";
import { KANBAN_COLUMNS } from "@/store/tasksStore";
import { useAuthStore } from "@/store/authStore";
import type { Task, TaskStatus } from "@/types/api.types";

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDispatch: (id: string) => Promise<void>;
  isDispatching: boolean;
}

// Timeline step data
interface TimelineStep {
  label: string;
  ts: string | null | undefined;
  status: TaskStatus;
}

export function TaskDetailDrawer({
  task, onClose, onStatusChange, onDispatch, isDispatching,
}: TaskDetailDrawerProps) {
  const { canDispatch } = useAuthStore();

  if (!task) return null;

  const steps: TimelineStep[] = [
    { label: "Notified",    ts: task.need?.created_at,  status: "notified"    },
    { label: "Accepted",    ts: task.accepted_at,        status: "accepted"    },
    { label: "In Progress", ts: task.dispatched_at,      status: "in_progress" },
    { label: "Completed",   ts: task.completed_at,       status: "completed"   },
  ];

  const currentIdx = KANBAN_COLUMNS.findIndex((c) => c.id === task.status);
  const nextCol    = KANBAN_COLUMNS[currentIdx + 1];

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-[#0D1424] border-l border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Status stripe */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-0.5",
              task.status === "notified"    ? "bg-sky-500"     :
              task.status === "accepted"    ? "bg-violet-500"  :
              task.status === "in_progress" ? "bg-amber-500"   :
              task.status === "completed"   ? "bg-emerald-500" : "bg-slate-600"
            )} />

            {/* Header */}
            <div className="px-6 pt-7 pb-5 border-b border-white/[0.06]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">Task · {task.id.slice(0, 8)}…</p>
                  <h2 className="text-xl font-bold text-white capitalize"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {task.need ? capitalize(task.need.type) : "Task"}
                  </h2>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={task.status} />
                {task.need && <UrgencyBadge label={task.need.urgency_label} score={task.need.urgency_score} />}
                {task.need && <ZoneBadge zone={task.need.zone} />}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Timeline */}
              <div className="px-6 py-5 border-b border-white/[0.05]">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-4">Timeline</p>
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.08]" />

                  <div className="space-y-4">
                    {steps.map((step, i) => {
                      const done    = i <= currentIdx;
                      const current = i === currentIdx;
                      return (
                        <div key={step.label} className="flex items-start gap-4 relative">
                          {/* Node */}
                          <div className={cn(
                            "w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 z-10",
                            done && !current ? "border-emerald-500/60 bg-emerald-500/20" :
                            current         ? "border-sky-400 bg-sky-400/20"            :
                                              "border-white/[0.1] bg-[#0D1424]"
                          )}>
                            {done && !current ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4L19 7"/>
                              </svg>
                            ) : current ? (
                              <motion.span
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-sky-400"
                              />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-white/[0.15]" />
                            )}
                          </div>

                          <div className="flex-1 pt-0.5">
                            <p className={cn(
                              "text-sm font-medium",
                              current ? "text-sky-300" : done ? "text-slate-300" : "text-slate-600"
                            )}>
                              {step.label}
                            </p>
                            {step.ts ? (
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{timeAgo(step.ts)}</p>
                            ) : current ? (
                              <p className="text-xs text-slate-600 mt-0.5">Current stage</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Need summary */}
              {task.need && (
                <div className="px-6 py-4 border-b border-white/[0.05]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Need Details</p>
                  <dl className="space-y-2.5">
                    {[
                      { label: "Affected",  value: `${task.need.count} ${task.need.count === 1 ? "person" : "people"}` },
                      { label: "Skill",     value: task.need.required_skill?.replace(/_/g, " ") },
                      { label: "Source",    value: task.need.source?.replace(/_/g, " ") },
                      { label: "Need ID",   value: <span className="font-mono text-sky-400 text-xs">{task.need.id}</span> },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-4">
                        <dt className="text-xs text-slate-500 shrink-0">{label}</dt>
                        <dd className="text-sm text-slate-300 capitalize text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Volunteer profile */}
              {task.volunteer && (
                <div className="px-6 py-4 border-b border-white/[0.05]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Assigned Volunteer</p>

                  <div className="flex items-center gap-3 mb-3">
                    <VolunteerAvatar name={task.volunteer.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200">{task.volunteer.name}</p>
                      <p className="text-xs text-slate-500">{task.volunteer.email}</p>
                      <p className="text-xs text-slate-500 font-mono">{task.volunteer.phone}</p>
                    </div>
                    <AvailabilityIndicator available={task.volunteer.available} showLabel={false} />
                  </div>

                  {/* Reliability */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Reliability</span>
                      <span className="text-xs font-mono text-slate-300">{task.volunteer.reliability_score}/100</span>
                    </div>
                    <ReliabilityBar score={task.volunteer.reliability_score} showLabel={false} />
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {task.volunteer.skills.map((s) => (
                      <SkillBadge key={s} skill={s} size="sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] space-y-2">
              {/* Dispatch (only for notified) */}
              {task.status === "notified" && canDispatch() && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onDispatch(task.id)}
                  disabled={isDispatching}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                    isDispatching
                      ? "bg-sky-500/30 text-sky-300/50 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_16px_rgba(14,165,233,0.2)]"
                  )}
                >
                  {isDispatching ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-sky-300/30 border-t-sky-300 rounded-full"/>
                      Sending notification…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                      Dispatch via WhatsApp / SMS
                    </>
                  )}
                </motion.button>
              )}

              {/* Advance status */}
              {nextCol && task.status !== "notified" && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onStatusChange(task.id, nextCol.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  Move to {nextCol.label}
                </motion.button>
              )}

              <button onClick={onClose}
                className="w-full py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Close
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}