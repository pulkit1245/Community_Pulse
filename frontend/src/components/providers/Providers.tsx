"use client";

// ─────────────────────────────────────────────────────────────
//  components/providers/Providers.tsx
//  Root client providers tree. Import once in root layout.tsx.
// ─────────────────────────────────────────────────────────────

import { SessionProvider } from "next-auth/react";
import { SessionSync } from "./SessionSync";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SessionSync>
        {children}
      </SessionSync>
    </SessionProvider>
  );
}