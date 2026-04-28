"use client";
// components/ui/Toast.tsx
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#34d399" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#38bdf8" strokeWidth="1.5"/>
      <path d="M8 7v4M8 5.5v.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14 13H2L8 2z" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 6v3M8 10.5v.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

const styles = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error:   "border-red-500/30 bg-red-500/10",
  info:    "border-sky-500/30 bg-sky-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
};

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const remove = useUIStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-auto min-w-[280px] max-w-sm rounded-xl border px-4 py-3",
              "flex items-start gap-3 backdrop-blur-sm",
              styles[t.type]
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white leading-snug">{t.title}</p>
              {t.message && (
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}