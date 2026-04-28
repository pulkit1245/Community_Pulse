"use client";
// ─────────────────────────────────────────────────────────────
//  components/layout/TopBar.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { cn, timeAgo } from "@/lib/utils";

export function TopBar({ title }: { title?: string }) {
  const { theme, toggleTheme, unreadAlerts, alertFeed, markAlertsRead } = useUIStore();
  const { user } = useAuthStore();
  const [alertsOpen, setAlertsOpen] = useState(false);

  function handleAlertToggle() {
    setAlertsOpen((v) => !v);
    if (!alertsOpen) markAlertsRead();
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0A0F1E]/80 backdrop-blur-sm shrink-0">
      <h1 className="text-white font-semibold text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {title ?? "Dashboard"}
      </h1>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        {/* Alerts bell */}
        <div className="relative">
          <button
            onClick={handleAlertToggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors relative"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center font-mono">
                {unreadAlerts > 9 ? "9+" : unreadAlerts}
              </span>
            )}
          </button>

          <AnimatePresence>
            {alertsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAlertsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-white/[0.1] bg-[#111827] shadow-2xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Gap Alerts</span>
                    <span className="text-xs text-slate-500 font-mono">{alertFeed.length} total</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {alertFeed.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">No alerts yet</div>
                    ) : (
                      alertFeed.slice(0, 10).map((alert) => (
                        <div key={alert.id} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-start gap-2">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                              alert.severity === "critical" ? "bg-red-400" :
                              alert.severity === "warning"  ? "bg-amber-400" : "bg-sky-400"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-200 leading-snug">{alert.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{alert.description}</p>
                              <p className="text-[10px] text-slate-600 mt-1 font-mono">{timeAgo(alert.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06]">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-xs font-bold text-sky-300">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-300 leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-600 font-mono capitalize mt-0.5">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}