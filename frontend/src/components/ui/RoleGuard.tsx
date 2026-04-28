"use client";

// ─────────────────────────────────────────────────────────────
//  components/ui/RoleGuard.tsx
//  Renders children only if the current user has the required
//  role or permission. Optionally renders a fallback.
// ─────────────────────────────────────────────────────────────

import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/auth.types";

interface RoleGuardProps {
  /** Allow if user has ANY of these roles */
  roles?: UserRole[];
  /** Allow if user has this permission string */
  permission?: string;
  /** Rendered when access is denied (default: null) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({
  roles,
  permission,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { user, can } = useAuthStore();

  if (!user) return <>{fallback}</>;

  const roleAllowed = roles ? roles.includes(user.role) : true;
  const permAllowed = permission ? can(permission) : true;

  if (roleAllowed && permAllowed) return <>{children}</>;

  return <>{fallback}</>;
}