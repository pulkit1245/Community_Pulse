// ─────────────────────────────────────────────────────────────
//  lib/api/client.ts
//  Central Axios instance — attaches JWT, normalises errors,
//  redirects to /login on 401.
// ─────────────────────────────────────────────────────────────

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { getSession, signOut } from "next-auth/react";

// ── Typed API error ───────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

export function isApiError(err: unknown): err is ApiError {
  return typeof err === "object" && err !== null && "status" in err;
}

// ── Axios instance ────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach Bearer token ─────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only runs in browser context (not during SSR)
    if (typeof window !== "undefined") {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalise errors ───────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;

    // 401 → sign out and redirect to login
    if (status === 401 && typeof window !== "undefined") {
      await signOut({ callbackUrl: "/login" });
      return Promise.reject({ status, message: "Session expired" });
    }

    const apiError: ApiError = {
      status,
      message:
        (data?.detail as string) ??
        (data?.message as string) ??
        error.message ??
        "An unexpected error occurred",
      detail: data,
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;