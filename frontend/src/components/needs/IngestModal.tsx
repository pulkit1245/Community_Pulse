"use client";
// ─────────────────────────────────────────────────────────────
//  components/needs/IngestModal.tsx
//  Two-mode ingest form:
//    1. Free-text description → backend NLP extracts fields
//    2. Structured form → explicit field entry
//  Shows a live "extracted" preview panel after description input.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { NeedType } from "@/types/api.types";

interface IngestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { description: string; zone?: string; type?: string }) => Promise<void>;
}

type Mode = "freetext" | "structured";

const ZONES = ["ward1", "ward2", "ward3", "ward4", "ward5", "ward6"];

const NEED_TYPES: { value: NeedType; label: string; emoji: string }[] = [
  { value: "food",          label: "Food & Nutrition",    emoji: "🍚" },
  { value: "medical",       label: "Medical / Health",    emoji: "🏥" },
  { value: "water",         label: "Water & Sanitation",  emoji: "💧" },
  { value: "shelter",       label: "Shelter & Housing",   emoji: "🏠" },
  { value: "elderly_care",  label: "Elderly Care",        emoji: "👴" },
  { value: "child_welfare", label: "Child Welfare",       emoji: "👶" },
  { value: "education",     label: "Education Support",   emoji: "📚" },
  { value: "mental_health", label: "Mental Health",       emoji: "🧠" },
  { value: "livelihood",    label: "Livelihood",          emoji: "💼" },
  { value: "disability",    label: "Disability Assist.",  emoji: "♿" },
  { value: "legal",         label: "Legal Aid",           emoji: "⚖️" },
  { value: "supplies",      label: "Supplies",            emoji: "📦" },
];

const EXAMPLE_DESCRIPTIONS = [
  "15 families in ward3 haven't eaten since yesterday, urgent food needed",
  "Elderly woman in ward1 needs medical attention, possible fracture",
  "Water supply cut off in ward5, 30 households affected",
  "3 children need school supplies in ward2, classes start Monday",
];

// Simulate optimistic extraction preview (actual NLP runs server-side)
function previewExtraction(text: string) {
  const lower = text.toLowerCase();
  const countMatch = text.match(/\b(\d+)\b/);
  const count = countMatch ? parseInt(countMatch[1]) : null;
  const zone = ZONES.find((z) => lower.includes(z.replace("ward", "ward "))) ??
               ZONES.find((z) => lower.includes(z));
  const urgentWords = ["urgent", "emergency", "critical", "immediately", "asap", "since yesterday"];
  const isUrgent = urgentWords.some((w) => lower.includes(w));

  let type: NeedType | null = null;
  if (lower.includes("food") || lower.includes("eat") || lower.includes("hungry")) type = "food";
  else if (lower.includes("medical") || lower.includes("health") || lower.includes("doctor") || lower.includes("fracture")) type = "medical";
  else if (lower.includes("water")) type = "water";
  else if (lower.includes("shelter") || lower.includes("house")) type = "shelter";
  else if (lower.includes("school") || lower.includes("education") || lower.includes("supplies")) type = "education";
  else if (lower.includes("elderly") || lower.includes("old")) type = "elderly_care";
  else if (lower.includes("child") || lower.includes("children")) type = "child_welfare";

  return { count, zone, type, isUrgent };
}

export function IngestModal({ open, onClose, onSubmit }: IngestModalProps) {
  const [mode, setMode] = useState<Mode>("freetext");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState("");
  const [type, setType] = useState<NeedType | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const preview = description.length > 20 ? previewExtraction(description) : null;

  function handleDescChange(val: string) {
    setDescription(val);
    setCharCount(val.length);
    // Auto-fill zone/type from preview if user hasn't manually set them
    if (mode === "freetext") {
      const p = previewExtraction(val);
      if (!zone && p.zone) setZone(p.zone);
      if (!type && p.type) setType(p.type);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        zone: zone || undefined,
        type: type || undefined,
      });
      // Reset
      setDescription(""); setZone(""); setType(""); setCharCount(0);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setDescription(""); setZone(""); setType(""); setCharCount(0);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-xl bg-[#0D1424] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-semibold text-white">Ingest Need</h2>
                  <p className="text-xs text-slate-500 mt-0.5">NLP auto-extracts type, zone, urgency</p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Mode toggle */}
              <div className="px-6 pt-4 flex gap-1 bg-white/[0.02] border-b border-white/[0.06] pb-3">
                {(["freetext", "structured"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 capitalize",
                      mode === m
                        ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {m === "freetext" ? "Free Text (AI)" : "Structured Form"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Description textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono">
                      {mode === "freetext" ? "Field Report / Description" : "Description"}
                    </label>
                    <span className={cn("text-[10px] font-mono", charCount > 400 ? "text-amber-400" : "text-slate-600")}>
                      {charCount}/500
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => handleDescChange(e.target.value)}
                    maxLength={500}
                    rows={4}
                    required
                    placeholder={
                      mode === "freetext"
                        ? "e.g. 15 families in ward3 haven't eaten since yesterday, urgent food needed"
                        : "Describe the need clearly…"
                    }
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-sm resize-none",
                      "bg-white/[0.05] border border-white/[0.08] text-slate-200 placeholder-slate-600",
                      "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40",
                      "transition-all duration-200"
                    )}
                  />

                  {/* Example prompts */}
                  {mode === "freetext" && description.length === 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EXAMPLE_DESCRIPTIONS.slice(0, 2).map((ex) => (
                        <button
                          type="button"
                          key={ex}
                          onClick={() => handleDescChange(ex)}
                          className="text-xs text-slate-500 hover:text-sky-400 transition-colors underline underline-offset-2 text-left"
                        >
                          Try: "{ex.slice(0, 45)}…"
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI extraction preview */}
                <AnimatePresence>
                  {mode === "freetext" && preview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                        <span className="text-xs text-sky-400 font-medium font-mono">NLP Preview (client-side)</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        {preview.type && (
                          <span className="text-slate-300">
                            Type: <span className="text-sky-300 capitalize font-medium">{preview.type.replace(/_/g, " ")}</span>
                          </span>
                        )}
                        {preview.count && (
                          <span className="text-slate-300">
                            Count: <span className="text-sky-300 font-medium font-mono">{preview.count}</span>
                          </span>
                        )}
                        {preview.zone && (
                          <span className="text-slate-300">
                            Zone: <span className="text-sky-300 font-medium font-mono">{preview.zone}</span>
                          </span>
                        )}
                        <span className="text-slate-300">
                          Urgency: <span className={cn("font-medium", preview.isUrgent ? "text-red-400" : "text-emerald-400")}>
                            {preview.isUrgent ? "High" : "Normal"}
                          </span>
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2">Server NLP will re-score with full spaCy + Claude Haiku pipeline</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Structured fields */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Zone */}
                  <div>
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono block mb-1.5">
                      Zone <span className="text-slate-600 normal-case">(optional)</span>
                    </label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl text-sm",
                        "bg-white/[0.05] border border-white/[0.08] text-slate-200",
                        "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40",
                        "transition-all duration-200 appearance-none cursor-pointer"
                      )}
                    >
                      <option value="" className="bg-[#111827]">Auto-detect</option>
                      {ZONES.map((z) => (
                        <option key={z} value={z} className="bg-[#111827] capitalize">{z}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono block mb-1.5">
                      Type <span className="text-slate-600 normal-case">(optional)</span>
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as NeedType | "")}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl text-sm",
                        "bg-white/[0.05] border border-white/[0.08] text-slate-200",
                        "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40",
                        "transition-all duration-200 appearance-none cursor-pointer"
                      )}
                    >
                      <option value="" className="bg-[#111827]">Auto-detect</option>
                      {NEED_TYPES.map(({ value, label, emoji }) => (
                        <option key={value} value={value} className="bg-[#111827]">
                          {emoji} {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.07] hover:border-white/[0.15] hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submitting || !description.trim()}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex-[2] py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                      "flex items-center justify-center gap-2",
                      submitting || !description.trim()
                        ? "bg-sky-500/30 text-sky-300/50 cursor-not-allowed"
                        : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_16px_rgba(14,165,233,0.2)]"
                    )}
                  >
                    {submitting ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-4 h-4 border-2 border-sky-300/30 border-t-sky-300 rounded-full"
                        />
                        Processing…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                        Ingest Need
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}