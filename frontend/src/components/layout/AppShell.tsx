"use client";
// components/layout/AppShell.tsx

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ToastContainer } from "@/components/ui/Toast";
import { useUIStore } from "@/store/uiStore";
import { useGapAlertSocket } from "@/hooks/useWebSocket";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const { theme } = useUIStore();
  useGapAlertSocket();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F1E]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} />
        <motion.main
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 overflow-y-auto p-6"
        >
          {children}
        </motion.main>
      </div>
      <ToastContainer />
    </div>
  );
}