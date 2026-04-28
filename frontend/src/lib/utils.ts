// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a timestamp as relative time (e.g. "3 min ago") */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Map urgency label to Tailwind color classes */
export function urgencyColors(label: string) {
  switch (label) {
    case "critical": return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" };
    case "moderate": return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" };
    default:         return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" };
  }
}

/** Map task status to display config */
export function taskStatusConfig(status: string) {
  switch (status) {
    case "notified":    return { label: "Notified",    color: "text-sky-400",     bg: "bg-sky-500/15" };
    case "accepted":    return { label: "Accepted",    color: "text-violet-400",  bg: "bg-violet-500/15" };
    case "in_progress": return { label: "In Progress", color: "text-amber-400",   bg: "bg-amber-500/15" };
    case "completed":   return { label: "Completed",   color: "text-emerald-400", bg: "bg-emerald-500/15" };
    case "declined":    return { label: "Declined",    color: "text-red-400",     bg: "bg-red-500/15" };
    default:            return { label: status,        color: "text-slate-400",   bg: "bg-slate-500/15" };
  }
}

/** Capitalise first letter */
export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}