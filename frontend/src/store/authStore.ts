// ─────────────────────────────────────────────────────────────
//  store/authStore.ts
//  Zustand slice for client-side auth state.
//  Source of truth is NextAuth session; this store provides
//  derived helpers (permissions, role checks) and a typed
//  user reference that components can consume without
//  calling useSession() directly everywhere.
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User, UserRole } from "@/types/auth.types";
import { hasPermission, canMatch, canDispatch, canWrite } from "@/types/auth.types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // ── Actions ─────────────────────────────────────────────────
  setSession: (user: User, accessToken: string) => void;
  clearSession: () => void;

  // ── Derived permission helpers ───────────────────────────────
  can: (permission: string) => boolean;
  canMatch: () => boolean;
  canDispatch: () => boolean;
  canWrite: () => boolean;
  isAdmin: () => boolean;
  isCoordinator: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setSession: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }, false, "auth/setSession"),

      clearSession: () =>
        set(
          { user: null, accessToken: null, isAuthenticated: false },
          false,
          "auth/clearSession"
        ),

      can: (permission) => {
        const role = get().user?.role;
        return role ? hasPermission(role, permission) : false;
      },

      canMatch: () => {
        const role = get().user?.role as UserRole | undefined;
        return role ? canMatch(role) : false;
      },

      canDispatch: () => {
        const role = get().user?.role as UserRole | undefined;
        return role ? canDispatch(role) : false;
      },

      canWrite: () => {
        const role = get().user?.role as UserRole | undefined;
        return role ? canWrite(role) : false;
      },

      isAdmin: () => get().user?.role === "admin",

      isCoordinator: () =>
        get().user?.role === "admin" || get().user?.role === "coordinator",
    }),
    { name: "AuthStore" }
  )
);