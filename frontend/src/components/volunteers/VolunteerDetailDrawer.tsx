"use client";
// ─────────────────────────────────────────────────────────────
//  components/volunteers/VolunteerDetailDrawer.tsx
//  Slide-in right drawer with volunteer profile, skills, stats.
// ─────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import {
  VolunteerAvatar, SkillBadge,
  AvailabilityIndicator, ReliabilityBar,
} from "./VolunteerPrimitives";
import { ZoneBadge } from "@/components/ui/Badges";
import { timeAgo, cn } from "@/lib/utils";
import type { Volunteer } from "@/types/api.types";
import { useAuthStore } from "@/store/authStore";

interface VolunteerDetailDrawerProps {
  volunteer: Volunteer | null;
  onClose: () => void;
  onEdit:  (v: Volunteer) => void;
}

export function VolunteerDetailDrawer({ volunteer, onClose, onEdit }: VolunteerDetailDrawerProps) {
  const { canWrite } = useAuthStore();

  return (
    <AnimatePresence>
      {volunteer && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col bg-[#0D1424] border-l border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Hero */}
            <div className="px-6 pt-7 pb-5 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent">
              <div className="flex items-start justify-between mb-5">
                <VolunteerAvatar name={volunteer.name} size="lg" />
                <div className="flex items-center gap-2">
                  {canWrite() && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => onEdit(volunteer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-sky-400 border border-sky-500/25 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </motion.button>
                  )}
                  <button onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-0.5"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {volunteer.name}
              </h2>
              <p className="text-sm text-slate-400">{volunteer.email}</p>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <AvailabilityIndicator available={volunteer.available} />
                <ZoneBadge zone={volunteer.zone} />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 p-5 border-b border-white/[0.05]">
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-1">Reliability</p>
                  <p className="text-2xl font-bold font-mono text-white mb-1">{volunteer.reliability_score}</p>
                  <ReliabilityBar score={volunteer.reliability_score} showLabel={false} />
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-1">Skills</p>
                  <p className="text-2xl font-bold font-mono text-white mb-1">{volunteer.skills.length}</p>
                  <p className="text-xs text-slate-500">specialisations</p>
                </div>
              </div>

              {/* Contact details */}
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Contact</p>
                <dl className="space-y-2.5">
                  {[
                    { label: "Phone", value: volunteer.phone },
                    { label: "Volunteer ID", value: <span className="font-mono text-sky-400 text-xs">{volunteer.id}</span> },
                    { label: "Joined", value: <span className="font-mono text-xs">{timeAgo(volunteer.created_at)}</span> },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <dt className="text-xs text-slate-500 shrink-0">{label}</dt>
                      <dd className={cn("text-sm text-slate-300 text-right truncate", typeof value !== "string" && "text-xs")}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Skills breakdown */}
              <div className="px-5 py-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Skills</p>
                {volunteer.skills.length === 0 ? (
                  <p className="text-xs text-slate-600">No skills recorded</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.map((skill) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SkillBadge skill={skill} size="md" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.02]">
              <button onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.07] hover:border-white/[0.15] hover:text-slate-200 transition-colors">
                Close
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}