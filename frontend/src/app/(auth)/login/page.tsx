"use client";

// ─────────────────────────────────────────────────────────────
//  app/(auth)/login/page.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

// ── Animation variants ────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const panelVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const errorVariants = {
  hidden: { opacity: 0, y: -8, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { duration: 0.25 },
  },
  exit: {
    opacity: 0,
    y: -8,
    height: 0,
    transition: { duration: 0.2 },
  },
};

// ── Types ─────────────────────────────────────────────────────

interface FormState {
  email: string;
  password: string;
}

interface FieldError {
  email?: string;
  password?: string;
}

// ── Inner component (uses useSearchParams) ────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldError>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (serverError) setServerError(null);
  }, [form.email, form.password]);

  function validate(): boolean {
    const next: FieldError = {};

    if (!form.email) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address";
    }

    if (!form.password) {
      next.password = "Password is required";
    } else if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError(null);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <motion.div
      className="flex-1 flex items-center justify-center p-8 lg:p-16 relative"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0 bg-white/[0.02] lg:border-l lg:border-white/[0.06]" />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L3 5.5V12.5L9 16L15 12.5V5.5L9 2Z"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="9" r="2" fill="#38bdf8" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">AI Social OS</span>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="mb-8">
            <h2
              className="text-white mb-2"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              Sign in
            </h2>
            <p
              className="text-slate-400 text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Access the coordinator dashboard
            </p>
          </motion.div>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            <AnimatePresence>
              {serverError && (
                <motion.div
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-400 mb-2 tracking-wide uppercase"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="coordinator@ngo.org"
                className={[
                  "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600",
                  "bg-white/[0.06] border transition-all duration-200 outline-none",
                  "focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50",
                  errors.email
                    ? "border-red-500/50"
                    : "border-white/10 hover:border-white/20",
                ].join(" ")}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mt-1.5 text-xs text-red-400"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-400 mb-2 tracking-wide uppercase"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className={[
                    "w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-600",
                    "bg-white/[0.06] border transition-all duration-200 outline-none",
                    "focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50",
                    errors.password
                      ? "border-red-500/50"
                      : "border-white/10 hover:border-white/20",
                  ].join(" ")}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mt-1.5 text-xs text-red-400"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className={[
                "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                "flex items-center justify-center gap-2",
                isLoading
                  ? "bg-sky-500/40 text-sky-200 cursor-not-allowed"
                  : "bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_24px_rgba(56,189,248,0.25)]",
              ].join(" ")}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {isLoading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-sky-200/30 border-t-sky-200 rounded-full"
                  />
                  Signing in...
                </>
              ) : (
                "Sign in to dashboard"
              )}
            </motion.button>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="mt-8 text-center text-xs text-slate-600"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            AI Social OS · Google Solution Challenge 2026
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Page (default export) — wraps LoginForm in Suspense ───────

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#0A0F1E]">
      {/* ── Left panel — branding ──────────────────────────────── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[52%] p-12 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Accent orbs */}
        <motion.div
          className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[-60px] w-[280px] h-[280px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Logo */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10">
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L3 5.5V12.5L9 16L15 12.5V5.5L9 2Z" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="9" cy="9" r="2" fill="#38bdf8" />
              </svg>
            </div>
            <span className="text-white font-semibold tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px" }}>
              AI Social OS
            </span>
          </motion.div>

          <motion.p variants={itemVariants} className="text-sky-400/70 text-sm font-medium tracking-widest uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Community Pulse · Google Solution Challenge 2026
          </motion.p>

          <motion.h1 variants={itemVariants} className="text-white mb-6 leading-[1.15]" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 700 }}>
            Turning scattered data
            <br />
            <span className="text-sky-400">into coordinated</span>
            <br />
            social impact.
          </motion.h1>

          <motion.p variants={itemVariants} className="text-slate-400 text-base leading-relaxed max-w-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            AI-powered platform that matches the right volunteers to the right needs — in under 60 seconds.
          </motion.p>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "<4 min", label: "Avg. dispatch time" },
            { value: "95%+", label: "Data structured" },
            { value: "48–72h", label: "Predictive alerts" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} className="border border-white/10 rounded-xl p-4 bg-white/[0.03]">
              <p className="text-sky-400 font-bold mb-1" style={{ fontFamily: "'DM Mono', monospace", fontSize: "20px" }}>
                {stat.value}
              </p>
              <p className="text-slate-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Right panel — login form wrapped in Suspense ──────── */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}