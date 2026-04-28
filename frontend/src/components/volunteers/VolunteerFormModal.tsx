"use client";
// ─────────────────────────────────────────────────────────────
//  components/volunteers/VolunteerFormModal.tsx
//  Shared create / edit modal.
//  Edit mode pre-fills all fields from the passed volunteer.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkillBadge, VolunteerAvatar } from "./VolunteerPrimitives";
import { cn } from "@/lib/utils";
import type { Volunteer, SkillType } from "@/types/api.types";
import type { CreateVolunteerPayload } from "@/lib/api/volunteers.service";

interface VolunteerFormModalProps {
  open: boolean;
  volunteer?: Volunteer | null; // null = create mode
  onClose: () => void;
  onCreate: (p: CreateVolunteerPayload) => Promise<void>;
  onUpdate: (id: string, p: Partial<CreateVolunteerPayload>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const ALL_SKILLS: { value: SkillType; label: string }[] = [
  { value: "medical",           label: "Medical"           },
  { value: "logistics",         label: "Logistics"         },
  { value: "food_distribution", label: "Food Distribution" },
  { value: "water_safety",      label: "Water Safety"      },
  { value: "construction",      label: "Construction"      },
  { value: "social_work",       label: "Social Work"       },
  { value: "teaching",          label: "Teaching"          },
  { value: "counselling",       label: "Counselling"       },
  { value: "legal",             label: "Legal"             },
  { value: "general",           label: "General"           },
];

const ZONES = ["ward1", "ward2", "ward3", "ward4", "ward5", "ward6"];

interface FormState {
  name: string;
  email: string;
  phone: string;
  zone: string;
  available: boolean;
  skills: SkillType[];
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(): FormState {
  return { name: "", email: "", phone: "", zone: "ward1", available: true, skills: [] };
}

function volunteerToForm(v: Volunteer): FormState {
  return { name: v.name, email: v.email, phone: v.phone, zone: v.zone, available: v.available, skills: [...v.skills] };
}

export function VolunteerFormModal({
  open, volunteer, onClose, onCreate, onUpdate, onDelete,
}: VolunteerFormModalProps) {
  const isEdit = !!volunteer;

  const [form, setForm]           = useState<FormState>(emptyForm());
  const [errors, setErrors]       = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form when modal opens
  useEffect(() => {
    if (open) {
      setForm(volunteer ? volunteerToForm(volunteer) : emptyForm());
      setErrors({});
      setConfirmDelete(false);
    }
  }, [open, volunteer]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleSkill(skill: SkillType) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  }

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.name.trim())                        e.name  = "Name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (!form.phone.match(/^\+?[\d\s\-]{7,15}$/)) e.phone = "Valid phone required";
    if (!form.zone)                               e.zone  = "Zone is required";
    if (form.skills.length === 0)                 e.skills = "Select at least one skill";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateVolunteerPayload = {
        name:      form.name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        zone:      form.zone,
        available: form.available,
        skills:    form.skills,
      };
      if (isEdit && volunteer) {
        await onUpdate(volunteer.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!volunteer || !onDelete) return;
    setSubmitting(true);
    try {
      await onDelete(volunteer.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const FieldError = ({ field }: { field: keyof FormState }) =>
    errors[field] ? (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-xs text-red-400">{errors[field]}</motion.p>
    ) : null;

  const inputClass = (field: keyof FormState) => cn(
    "w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200",
    "bg-white/[0.05] border text-slate-200 placeholder-slate-600",
    "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40",
    errors[field] ? "border-red-500/40" : "border-white/[0.08]"
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg bg-[#0D1424] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  {isEdit && volunteer && <VolunteerAvatar name={volunteer.name} size="sm" />}
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {isEdit ? `Edit ${volunteer!.name}` : "Add Volunteer"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isEdit ? `ID: ${volunteer!.id}` : "Create a new volunteer profile"}
                    </p>
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Name + Email row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono block mb-1.5">Name</label>
                    <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                      placeholder="Priya Sharma" className={inputClass("name")} />
                    <FieldError field="name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono block mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                      placeholder="priya@ngo.org" className={inputClass("email")} />
                    <FieldError field="email" />
                  </div>
                </div>

                {/* Phone + Zone row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono block mb-1.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                      placeholder="+91 98765 43210" className={inputClass("phone")} />
                    <FieldError field="phone" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono block mb-1.5">Zone</label>
                    <select value={form.zone} onChange={(e) => set("zone", e.target.value)}
                      className={cn(inputClass("zone"), "appearance-none cursor-pointer")}>
                      {ZONES.map((z) => (
                        <option key={z} value={z} className="bg-[#111827] capitalize">{z}</option>
                      ))}
                    </select>
                    <FieldError field="zone" />
                  </div>
                </div>

                {/* Availability toggle */}
                <div className="flex items-center justify-between py-2 px-4 rounded-xl border border-white/[0.07] bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Available for dispatch</p>
                    <p className="text-xs text-slate-500">Volunteer can be matched to needs</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("available", !form.available)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors duration-200",
                      form.available ? "bg-emerald-500" : "bg-slate-700"
                    )}
                  >
                    <motion.span
                      animate={{ x: form.available ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                    />
                  </button>
                </div>

                {/* Skills grid */}
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono block mb-2">
                    Skills <span className="text-slate-600 normal-case">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SKILLS.map(({ value, label }) => {
                      const selected = form.skills.includes(value);
                      return (
                        <motion.button
                          key={value}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleSkill(value)}
                          className={cn(
                            "transition-all duration-150",
                            selected ? "scale-[1.02]" : ""
                          )}
                        >
                          {selected ? (
                            <SkillBadge skill={value} size="md" className="ring-2 ring-offset-1 ring-offset-[#0D1424]" />
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-white/[0.08] text-slate-500 bg-transparent hover:border-white/[0.2] hover:text-slate-300 transition-colors capitalize">
                              {label}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  <FieldError field="skills" />
                  {form.skills.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">{form.skills.length} skill{form.skills.length > 1 ? "s" : ""} selected</p>
                  )}
                </div>

                {/* Delete confirmation */}
                <AnimatePresence>
                  {confirmDelete && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 p-3"
                    >
                      <p className="text-sm text-red-300 mb-2">Remove <strong>{volunteer?.name}</strong> permanently?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-1.5 rounded-lg text-xs text-slate-400 border border-white/[0.1] hover:border-white/[0.2] transition-colors">
                          Cancel
                        </button>
                        <button type="button" onClick={handleDelete} disabled={submitting}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors">
                          {submitting ? "Removing…" : "Yes, remove"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Footer */}
              <div className={cn(
                "px-6 py-4 border-t border-white/[0.06] flex gap-3",
                isEdit ? "justify-between" : "justify-end"
              )}>
                {isEdit && onDelete && !confirmDelete && (
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                    Remove
                  </button>
                )}

                <div className="flex gap-2 ml-auto">
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.07] hover:border-white/[0.15] hover:text-slate-200 transition-colors">
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={cn(
                      "px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                      submitting
                        ? "bg-emerald-500/30 text-emerald-300/50 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                    )}
                  >
                    {submitting ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full"/>
                        Saving…
                      </>
                    ) : isEdit ? "Save Changes" : "Create Volunteer"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}