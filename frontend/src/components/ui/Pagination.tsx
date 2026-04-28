"use client";
// components/ui/Pagination.tsx

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit?: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, pages, total, limit = 20, onPage }: PaginationProps) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  // Build page number array with ellipsis
  function getPageNumbers(): (number | "…")[] {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4)  return [1, 2, 3, 4, 5, "…", pages];
    if (page >= pages - 3) return [1, "…", pages-4, pages-3, pages-2, pages-1, pages];
    return [1, "…", page-1, page, page+1, "…", pages];
  }

  const pageNums = getPageNumbers();

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-slate-500 font-mono">
        {from}–{to} of {total}
      </span>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors",
            page === 1
              ? "text-slate-700 cursor-not-allowed"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </motion.button>

        {/* Page numbers */}
        {pageNums.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-xs">…</span>
          ) : (
            <motion.button
              key={p}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPage(p as number)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium font-mono transition-all duration-150",
                p === page
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.07]"
              )}
            >
              {p}
            </motion.button>
          )
        )}

        {/* Next */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors",
            page === pages
              ? "text-slate-700 cursor-not-allowed"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}