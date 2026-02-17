"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { PlayCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const container: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.12 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export function HeroSection() {
  return (
    <section className="relative px-4 pt-36 pb-20 md:px-6 md:pt-44 md:pb-28">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-5xl"
      >
        <motion.div variants={item}>
          <Badge className="glass-panel rounded-full px-4 py-1.5 text-sm font-medium text-slate-800 shadow-lg">
            <Sparkles className="mr-1 size-4" />
            Welcome, GSU Alumni Network
          </Badge>
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-6 text-balance text-5xl font-bold tracking-tight text-slate-900 md:text-7xl"
        >
          Your Alumni Community.
          <span className="text-premium-gradient block">
            Elevated.
          </span>
        </motion.h1>

        <motion.p variants={item} className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
          Connect with verified alumni, unlock private job opportunities, and celebrate milestones in one premium network built for your lifelong growth.
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 text-base font-semibold text-white shadow-xl shadow-indigo-300/50 hover:from-indigo-500 hover:to-purple-500"
            onClick={() => toast.success("Welcome to GSU Gombe Alumni. Account onboarding starts next.")}
          >
            <Link href="/register">Join Exclusive Network</Link>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/80 bg-white/70 px-7 text-base text-slate-800 shadow-lg backdrop-blur-xl"
              >
                <PlayCircle className="size-5" />
                Watch Demo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl border-white/60 bg-white/90 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>GSU Gombe Alumni Platform Walkthrough</DialogTitle>
                <DialogDescription>
                  Preview GOMBE STATE UNIVERSITY (GSU) directory search, alumni-only job listings, and achievement sharing in under two minutes.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-slate-100 to-indigo-100 p-8 text-sm text-slate-600">
                Demo modal ready. Replace this area with your product video embed when available.
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div variants={item} className="glass-panel mt-10 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-1 gap-3 text-center text-sm font-medium text-slate-700 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:text-base">
            <p>
              <AnimatedCounter value={10} suffix="K+" /> Active Alumni
            </p>
            <Separator orientation="vertical" className="hidden h-6 bg-slate-300/70 md:block" />
            <p>
              <AnimatedCounter value={500} suffix="+" /> Jobs
            </p>
            <Separator orientation="vertical" className="hidden h-6 bg-slate-300/70 md:block" />
            <p>
              <AnimatedCounter value={2} suffix="K+" /> Achievements
            </p>
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-8 flex items-center gap-3 text-sm text-slate-600">
          <div className="flex -space-x-3">
            <Avatar className="border-2 border-white shadow-sm">
              <AvatarImage src="/images/avatars/alumni-1.jpeg" alt="GSU Alumnus 1" />
              <AvatarFallback>A1</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-white shadow-sm">
              <AvatarImage src="/images/avatars/alumni-2.jpeg" alt="GSU Alumnus 2" />
              <AvatarFallback>A2</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-white shadow-sm">
              <AvatarImage src="/images/brand/gsu-mark.png" alt="GSU Brand Mark" />
              <AvatarFallback>GSU</AvatarFallback>
            </Avatar>
          </div>
          Trusted by alumni from 120+ graduating classes.
        </motion.div>
      </motion.div>
    </section>
  );
}

