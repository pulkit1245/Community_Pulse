// ─────────────────────────────────────────────────────────────
//  next-auth.d.ts
//  Augments NextAuth Session and JWT to carry our User shape
// ─────────────────────────────────────────────────────────────

import type { DefaultSession, DefaultJWT } from "next-auth";
import type { User, UserRole } from "@/types/auth.types";

declare module "next-auth" {
  interface Session extends DefaultSession {
    /** Raw JWT from the backend — forwarded to every API request */
    accessToken: string;
    user: User & DefaultSession["user"];
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    zone?: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    zone?: string;
    accessToken: string;
  }
}