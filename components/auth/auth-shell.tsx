"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

type AuthShellProps = {
  mode: "login" | "register";
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
  return (
    <main className="bg-premium-mesh relative min-h-screen overflow-hidden px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute -top-24 -left-16 h-[280px] w-[280px] rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-16 h-[320px] w-[320px] rounded-full bg-purple-300/25 blur-3xl" />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-panel hidden rounded-3xl p-8 lg:flex lg:flex-col lg:justify-between"
        >
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-slate-900">
              <Image
                src="/images/brand/gsu-logo.svg"
                alt="GOMBE STATE UNIVERSITY (GSU) Logo"
                width={44}
                height={44}
                className="rounded-xl bg-white p-1 shadow-lg"
                priority
              />
              <span className="text-lg font-semibold tracking-tight">GSU Gombe Alumni</span>
            </Link>

            <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900">
              GOMBE STATE UNIVERSITY (GSU)
            </h1>
            <p className="mt-3 max-w-md text-slate-600">
              Private alumni access for verified members, exclusive opportunities, and milestone celebrations.
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-700">Platform Benefits</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Global directory by department and graduation year</li>
              <li>Alumni-only jobs and referrals</li>
              <li>Achievement feed for the GSU community</li>
            </ul>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
          className="glass-panel rounded-3xl p-6 shadow-2xl md:p-8"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-indigo-700">
              {mode === "login" ? "Member Access" : "New Member"}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-2 text-slate-600">{subtitle}</p>
          </div>
          <div className="mt-8">{children}</div>
        </motion.section>
      </div>
    </main>
  );
}
