"use client";

// ─────────────────────────────────────────────────────────────
//  components/providers/SessionSync.tsx
//  Bridges NextAuth session → Zustand authStore.
//  Wrap this inside the NextAuth <SessionProvider>.
// ─────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/authStore";

export function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setSession, clearSession } = useAuthStore();

  useEffect(() => {
    if (status === "authenticated" && session) {
      setSession(session.user, session.accessToken);
    } else if (status === "unauthenticated") {
      clearSession();
    }
  }, [session, status, setSession, clearSession]);

  return <>{children}</>;
}