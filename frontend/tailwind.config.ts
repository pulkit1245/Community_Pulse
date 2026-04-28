// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-sans)", "DM Sans", "system-ui", "sans-serif"],
        mono:  ["var(--font-mono)", "DM Mono", "monospace"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
      },
      colors: {
        background: "var(--bg-primary)",
        surface:    "var(--bg-surface)",
        foreground: "var(--text-primary)",
        muted:      "var(--text-muted)",
        border:     "var(--border-default)",
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover:   "var(--brand-hover)",
        },
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;