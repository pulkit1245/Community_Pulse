"use client";
// ─────────────────────────────────────────────────────────────
//  components/needs/NeedDetailDrawer.tsx
//  Slide-in right drawer showing full Need Card details.
//  Coordinator+ can update status inline.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, ZoneBadge, StatusPill } from "@/components/ui/Badges";
import { timeAgo, capitalize, cn } from "@/lib/utils";
import type { Need, NeedStatus } from "@/types/api.types";
import { useAuthStore } from "@/store/authStore";

interface NeedDetailDrawerProps {
  need: Need | null;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<Need>) => Promise<void>;
}

const STATUS_FLOW: NeedStatus[] = ["unmatched", "matched", "in_progress", "completed"];

const DETAIL_ROWS: { label: string; render: (n: Need) => React.ReactNode }[] = [
  { label: "Need ID",       render: (n) => <span className="font-mono text-sky-400 text-xs">{n.id}</span> },
  { label: "Type",          render: (n) => <span className="capitalize text-slate-200">{n.type.replace(/_/g, " ")}</span> },
  { label: "Zone",          render: (n) => <ZoneBadge zone={n.zone} /> },
  { label: "Affected",      render: (n) => <span className="font-mono text-slate-200">{n.count} people</span> },
  { label: "Required Skill",render: (n) => <span className="capitalize text-slate-200">{n.required_skill.replace(/_/g, " ")}</span> },
  { label: "Source",        render: (n) => <span className="capitalize text-slate-400 text-xs">{n.source.replace(/_/g, " ")}</span> },
  { label: "Created",       render: (n) => <span className="text-slate-400 text-xs font-mono">{new Date(n.created_at).toLocaleString()}</span> },
  { label: "Last Updated",  render: (n) => <span className="text-slate-400 text-xs font-mono">{timeAgo(n.updated_at)}</span> },
];

const URGENCY_BG: Record<string, string> = {
  critical: "from-red-500/10  to-transparent",
  moderate: "from-amber-500/10 to-transparent",
  low:      "from-emerald-500/10 to-transparent",
};

export function NeedDetailDrawer({ need, onClose, onPatch }: NeedDetailDrawerProps) {
  const { canWrite } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<NeedStatus | null>(null);

  const currentStatus = localStatus ?? need?.status ?? "unmatched";

  async function handleStatusChange(status: NeedStatus) {
    if (!need) return;
    setLocalStatus(status);
    setSaving(true);
    await onPatch(need.id, { status });
    setSaving(false);
  }

  // Reset local state when drawer re-opens with new need
  const handleClose = () => {
    setLocalStatus(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {need && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-[#0D1424] border-l border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Urgency gradient top bar */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-1",
              need.urgency_label === "critical" ? "bg-red-500" :
              need.urgency_label === "moderate" ? "bg-amber-500" : "bg-emerald-500"
            )} />

            {/* Hero section */}
            <div className={cn(
              "px-6 pt-7 pb-5 bg-gradient-to-b border-b border-white/[0.06]",
              URGENCY_BG[need.urgency_label]
            )}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-mono mb-1">Need Card</p>
                  <h2
                    className="text-xl font-bold text-white capitalize"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {capitalize(need.type)}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <UrgencyBadge label={need.urgency_label} score={need.urgency_score} />
                <ZoneBadge zone={need.zone} />
                <StatusPill status={currentStatus} />
                {saving && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-slate-400 font-mono flex items-center gap-1"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-3 h-3 border border-slate-400/40 border-t-slate-400 rounded-full"
                    />
                    Saving…
                  </motion.span>
                )}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Description */}
              {need.description && (
                <div className="px-6 py-4 border-b border-white/[0.05]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-2">Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{need.description}</p>
                </div>
              )}

              {/* Detail rows */}
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Details</p>
                <dl className="space-y-3">
                  {DETAIL_ROWS.map(({ label, render }) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <dt className="text-xs text-slate-500 shrink-0 w-32">{label}</dt>
                      <dd className="text-right">{render(need)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Urgency score breakdown */}
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Urgency Score</p>
                <div className="flex items-end gap-2 mb-2">
                  <span
                    className="text-4xl font-bold font-mono"
                    style={{
                      color: need.urgency_label === "critical" ? "#f87171" :
                             need.urgency_label === "moderate" ? "#fbbf24" : "#34d399"
                    }}
                  >
                    {need.urgency_score}
                  </span>
                  <span className="text-slate-500 text-sm mb-1">/ 100</span>
                </div>
                {/* Score bar */}
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${need.urgency_score}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                    className="h-full rounded-full"
                    style={{
                      background: need.urgency_label === "critical"
                        ? "linear-gradient(90deg, #ef4444, #f87171)"
                        : need.urgency_label === "moderate"
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                        : "linear-gradient(90deg, #22c55e, #34d399)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                  <span>0 · Low</span>
                  <span>40 · Moderate</span>
                  <span>70 · Critical</span>
                </div>
              </div>

              {/* Status update (coordinator+) */}
              {canWrite() && (
                <div className="px-6 py-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Update Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_FLOW.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={saving || currentStatus === s}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 capitalize",
                          currentStatus === s
                            ? "bg-white/[0.08] text-slate-200 border-white/[0.15] cursor-default"
                            : "text-slate-500 border-white/[0.07] hover:border-white/[0.15] hover:text-slate-300 hover:bg-white/[0.04]"
                        )}
                      >
                        {s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.07] hover:border-white/[0.15] hover:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}