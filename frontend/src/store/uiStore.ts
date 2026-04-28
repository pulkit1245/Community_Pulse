"use client";
// ─────────────────────────────────────────────────────────────
//  store/uiStore.ts
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { GapAlert } from "@/types/api.types";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toasts: Toast[];
  alertFeed: GapAlert[];
  unreadAlerts: number;

  // Actions
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebarCollapsed: () => void;
  addToast: (t: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  pushAlert: (alert: GapAlert) => void;
  markAlertsRead: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: "dark",
        sidebarOpen: true,
        sidebarCollapsed: false,
        toasts: [],
        alertFeed: [],
        unreadAlerts: 0,

        toggleTheme: () => {
          const next = get().theme === "dark" ? "light" : "dark";
          set({ theme: next }, false, "ui/toggleTheme");
          document.documentElement.classList.toggle("dark", next === "dark");
        },

        setTheme: (t) => {
          set({ theme: t }, false, "ui/setTheme");
          document.documentElement.classList.toggle("dark", t === "dark");
        },

        setSidebarOpen: (v) => set({ sidebarOpen: v }, false, "ui/setSidebarOpen"),

        toggleSidebarCollapsed: () =>
          set(
            (s) => ({ sidebarCollapsed: !s.sidebarCollapsed }),
            false,
            "ui/toggleSidebarCollapsed"
          ),

        addToast: (t) => {
          const id = crypto.randomUUID();
          set(
            (s) => ({ toasts: [...s.toasts, { ...t, id }] }),
            false,
            "ui/addToast"
          );
          // Auto-remove after 4s
          setTimeout(() => get().removeToast(id), 4000);
        },

        removeToast: (id) =>
          set(
            (s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }),
            false,
            "ui/removeToast"
          ),

        pushAlert: (alert) =>
          set(
            (s) => ({
              alertFeed: [alert, ...s.alertFeed].slice(0, 50),
              unreadAlerts: s.unreadAlerts + 1,
            }),
            false,
            "ui/pushAlert"
          ),

        markAlertsRead: () =>
          set({ unreadAlerts: 0 }, false, "ui/markAlertsRead"),
      }),
      {
        name: "ui-store",
        partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
      }
    ),
    { name: "UIStore" }
  )
);