// ─────────────────────────────────────────────────────────────
//  lib/api/auth.service.ts
//  Calls the backend authentication endpoints directly.
//  Used by NextAuth Credentials provider (server-side) so we
//  use plain fetch here — not the Axios client — to avoid
//  browser-only getSession() inside the server handler.
// ─────────────────────────────────────────────────────────────

import type { LoginRequest, LoginResponse } from "@/types/auth.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function loginUser(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { detail?: string }).detail ?? "Invalid credentials"
    );
  }

  return response.json() as Promise<LoginResponse>;
}