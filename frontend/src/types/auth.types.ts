// ─────────────────────────────────────────────────────────────
//  Auth Types
//  Mirrors the backend JWT payload + RBAC roles
// ─────────────────────────────────────────────────────────────

export type UserRole = "admin" | "coordinator" | "volunteer" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Optional: zone/region the user is assigned to */
  zone?: string;
}

// ── Backend /auth/login request & response ───────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

// ── Role permission helpers ───────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["read", "write", "delete", "match", "dispatch"],
  coordinator: ["read", "write", "match", "dispatch"],
  volunteer: ["read", "self_update"],
  viewer: ["read"],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canMatch(role: UserRole): boolean {
  return hasPermission(role, "match");
}

export function canDispatch(role: UserRole): boolean {
  return hasPermission(role, "dispatch");
}

export function canWrite(role: UserRole): boolean {
  return hasPermission(role, "write");
}