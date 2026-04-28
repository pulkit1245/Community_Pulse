"use client";
// components/dashboard/MatchButton.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useMatchStore } from "@/store/matchStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export function MatchButton() {
  const { isMatching, runMatch, lastRunAt, assignments } = useMatchStore();
  const { addToast } = useUIStore();
  const { canMatch } = useAuthStore();

  if (!canMatch()) return null;

  async function handleMatch() {
    try {
      const result = await runMatch();
      addToast({
        type: "success",
        title: `Matched ${result.matched_count} of ${result.total_needs} needs`,
        message: result.unmatched_needs.length > 0
          ? `${result.unmatched_needs.length} needs still unmatched`
          : "All needs successfully assigned",
      });
    } catch {
      addToast({ type: "error", title: "Match failed", message: "Please try again" });
    }
  }

  const lastRun = lastRunAt
    ? new Date(lastRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Smart Matching</h3>
          <p className="text-xs text-slate-500">Hungarian algorithm · O(n³) optimal</p>
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="flex items-center gap-4 mb-4 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05]">
          <div className="text-center">
            <p className="text-lg font-bold text-violet-300 font-mono">{assignments.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Assigned</p>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          {lastRun && (
            <div>
              <p className="text-xs text-slate-400">Last run</p>
              <p className="text-sm font-mono text-slate-200">{lastRun}</p>
            </div>
          )}
        </div>
      )}

      <motion.button
        onClick={handleMatch}
        disabled={isMatching}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
          "flex items-center justify-center gap-2.5 relative overflow-hidden",
          isMatching
            ? "bg-violet-500/30 text-violet-300 cursor-not-allowed"
            : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.3)]"
        )}
      >
        {!isMatching && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
          />
        )}
        <AnimatePresence mode="wait">
          {isMatching ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-4 h-4 border-2 border-violet-300/30 border-t-violet-300 rounded-full"/>
              Running algorithm...
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Run Match Engine
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <p className="text-center text-[10px] text-slate-600 mt-2">Globally optimal · Assigns all needs simultaneously</p>
    </div>
  );
}