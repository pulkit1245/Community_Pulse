// ─────────────────────────────────────────────────────────────
//  app/layout.tsx  — Root layout
// ─────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

// ── Fonts ─────────────────────────────────────────────────────

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["700"],
  display: "swap",
});

// ── Metadata ──────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "AI Social OS — Coordinator Dashboard",
    template: "%s · AI Social OS",
  },
  description:
    "AI-powered platform for intelligent resource allocation and volunteer coordination. Google Solution Challenge 2026.",
};

// ── Root layout ───────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable}`}
    >
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}