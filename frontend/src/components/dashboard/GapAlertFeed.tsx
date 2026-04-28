"use client";
// components/dashboard/GapAlertFeed.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/uiStore";
import { timeAgo, cn } from "@/lib/utils";

export function GapAlertFeed() {
  const { alertFeed } = useUIStore();

  const severityStyle = (s: string) => ({
    critical: { dot: "bg-red-400",   bg: "border-red-500/20 bg-red-500/5"   },
    warning:  { dot: "bg-amber-400", bg: "border-amber-500/20 bg-amber-500/5" },
    info:     { dot: "bg-sky-400",   bg: "border-sky-500/20 bg-sky-500/5"   },
  }[s] ?? { dot: "bg-slate-400", bg: "border-white/[0.07] bg-white/[0.03]" });

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-red-400"
          />
          <h2 className="text-sm font-semibold text-white">Gap Alert Feed</h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">Live</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-64 p-3 space-y-2">
        <AnimatePresence initial={false}>
          {alertFeed.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">Monitoring for alerts…</div>
          ) : (
            alertFeed.slice(0, 8).map((alert) => {
              const s = severityStyle(alert.severity);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("rounded-xl border px-3 py-2.5", s.bg)}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", s.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-medium text-slate-200 leading-snug">{alert.title}</p>
                        <span className="text-[10px] text-slate-600 font-mono shrink-0">{timeAgo(alert.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{alert.description}</p>
                      {alert.zone && <span className="inline-block mt-1 text-[10px] font-mono text-slate-600 bg-white/[0.05] px-1.5 py-0.5 rounded">{alert.zone}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}