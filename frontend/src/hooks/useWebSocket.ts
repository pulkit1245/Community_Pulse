"use client";
// ─────────────────────────────────────────────────────────────
//  hooks/useWebSocket.ts
//  Connects to the backend WebSocket for live gap alerts.
//  Auto-reconnects with exponential backoff.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import type { GapAlert } from "@/types/api.types";

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws");

export function useGapAlertSocket() {
  const { data: session } = useSession();
  const pushAlert = useUIStore((s) => s.pushAlert);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!session?.accessToken) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${WS_BASE}/ws/alerts?token=${session.accessToken}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const alert: GapAlert = JSON.parse(event.data as string);
        pushAlert(alert);
      } catch {
        // Ignore malformed frames
      }
    };

    ws.onclose = () => {
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * 2 ** attemptsRef.current, 30_000);
      attemptsRef.current += 1;
      retryRef.current = setTimeout(connect, delay);
    };

    ws.onopen = () => {
      attemptsRef.current = 0;
    };
  }, [session?.accessToken, pushAlert]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}