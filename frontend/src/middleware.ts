// ─────────────────────────────────────────────────────────────
//  middleware.ts  (project root, next to /src)
//  Protects all dashboard routes. Unauthenticated requests are
//  redirected to /login. The login page redirects authenticated
//  users to /dashboard.
// ─────────────────────────────────────────────────────────────

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";


// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/needs",
  "/volunteers",
  "/match",
  "/tasks",
  "/analytics",
  "/settings",
];

// Routes that should redirect authenticated users away (e.g. login)
const AUTH_ROUTES = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next.js internals and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};