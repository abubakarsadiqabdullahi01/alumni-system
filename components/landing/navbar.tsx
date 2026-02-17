"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  return (
    <motion.header
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="glass-panel mx-auto mt-4 flex w-[min(1100px,92%)] items-center justify-between rounded-2xl px-4 py-3 shadow-indigo-200/35 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <Image
            src="/images/brand/gsu-mark.png"
            alt="GSU Mark"
            width={36}
            height={36}
            className="rounded-xl shadow-lg"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">GSU Gombe Alumni</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <Button asChild variant="ghost" className="h-10 rounded-xl px-4 text-sm md:text-base">
            <Link href="/login">
              <LogIn className="size-4" />
              Login
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-400/35 hover:from-indigo-500 hover:to-purple-500 md:px-5 md:text-base"
          >
            <Link href="/register">
              <UserPlus className="size-4" />
              Join Now
            </Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

