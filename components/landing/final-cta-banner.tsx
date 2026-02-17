"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCtaBanner() {
  return (
    <section className="px-4 pb-20 md:px-6 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mx-auto w-full max-w-6xl rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-2xl shadow-indigo-300/45 md:flex md:items-center md:justify-between md:p-12"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-100">Exclusive Access</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Ready to join your network?</h3>
          <p className="mt-3 max-w-xl text-indigo-100">
            Create your account and unlock verified alumni relationships, opportunities, and achievements.
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="mt-6 h-12 rounded-xl bg-white px-7 text-base font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50 md:mt-0"
        >
          <Link href="/register">
            Create Account
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}

