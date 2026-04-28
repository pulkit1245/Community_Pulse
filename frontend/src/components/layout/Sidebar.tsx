"use client";
// ─────────────────────────────────────────────────────────────
//  components/layout/Sidebar.tsx
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
}

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
  },
  {
    href: "/needs",
    label: "Needs",
    icon: <Icon d="M18 8h1a4 4 0 010 8h-1 M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3" />,
  },
  {
    href: "/volunteers",
    label: "Volunteers",
    icon: <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />,
  },
  {
    href: "/match",
    label: "Match",
    icon: <Icon d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" />,
    permission: "match",
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: <Icon d="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: <Icon d="M18 20V10 M12 20V4 M6 20v-6" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed, unreadAlerts } = useUIStore();
  const { user, can } = useAuthStore();

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="h-screen flex flex-col bg-[#0A0F1E] border-r border-white/[0.06] shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L3 5.5V12.5L9 16L15 12.5V5.5L9 2Z" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="9" cy="9" r="2" fill="#38bdf8"/>
          </svg>
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="text-white font-semibold text-sm whitespace-nowrap"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              AI Social OS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 group relative",
                isActive
                  ? "bg-sky-500/15 text-sky-300"
                  : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sky-400 rounded-full"
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              )}

              <span className="shrink-0">{item.icon}</span>

              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap font-medium"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Alert badge on Dashboard */}
              {item.href === "/dashboard" && unreadAlerts > 0 && (
                <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  {unreadAlerts > 9 ? "9+" : unreadAlerts}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + collapse */}
      <div className="border-t border-white/[0.06] px-2 py-3 space-y-0.5">
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebarCollapsed}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300 transition-colors text-sm"
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            className={cn("shrink-0 transition-transform duration-300", sidebarCollapsed && "rotate-180")}
          >
            <path d="M11 19l-7-7 7-7 M18 19l-7-7 7-7" />
          </svg>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="whitespace-nowrap font-medium">
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User */}
        {user && (
          <div className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5",
            "bg-white/[0.03] border border-white/[0.05]"
          )}>
            <div className="w-7 h-7 shrink-0 rounded-full bg-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-300">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono capitalize">{user.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />
          </svg>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="whitespace-nowrap font-medium">
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}