// ─────────────────────────────────────────────────────────────
//  lib/auth.ts
//  NextAuth v5 configuration.
//  Strategy: Credentials provider → calls backend /auth/login
//  → stores backend JWT in the NextAuth JWT → exposes it on
//  session.accessToken for Axios requests.
// ─────────────────────────────────────────────────────────────

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginUser } from "@/lib/api/auth.service";
import type { User } from "@/types/auth.types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const data = await loginUser({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          // Return a User object that NextAuth will pass to the jwt callback
          const user: User & { accessToken: string } = {
            ...data.user,
            accessToken: data.access_token,
          };

          return user;
        } catch {
          // Returning null triggers the CredentialsSignin error
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ── JWT callback: persist backend token and user fields ───
    async jwt({ token, user }) {
      if (user) {
        // First sign-in — user is populated
        const u = user as User & { accessToken: string };
        token.id = u.id;
        token.role = u.role;
        token.zone = u.zone;
        token.accessToken = u.accessToken;
        token.name = u.name;
        token.email = u.email;
      }
      return token;
    },

    // ── Session callback: expose token fields on session ──────
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as User["role"],
        zone: token.zone as string | undefined,
        name: token.name ?? "",
        email: token.email ?? "",
      };
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    // Match backend token TTL (default 60 min)
    maxAge: 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
});