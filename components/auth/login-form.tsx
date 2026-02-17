"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Login failed");
        return;
      }

      toast.success("Login successful");
      router.replace(result.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error while logging in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-2"
      >
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@gsu.edu.ng"
            className="h-11 rounded-xl border-white/60 bg-white/80 pl-10"
            required
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
        className="space-y-2"
      >
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-11 rounded-xl border-white/60 bg-white/80 pl-10"
            required
          />
        </div>
      </motion.div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="font-normal">
            Remember me
          </Label>
        </div>
      </div>

      <Button
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold text-white hover:from-indigo-500 hover:to-purple-500"
      >
        {isSubmitting ? "Signing in..." : "Login to GSU Alumni"}
      </Button>

      <div className="rounded-xl border border-white/70 bg-white/70 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Seeded Test Accounts</p>
        <p className="mt-1">Admin: admin@gsu-alumni.local</p>
        <p>Moderator: moderator@gsu-alumni.local</p>
        <p>Member: member@gsu-alumni.local</p>
        <p className="mt-1">Password: Password@123</p>
      </div>

      <p className="text-center text-sm text-slate-600">
        New member?{" "}
        <Link href="/register" className="font-semibold text-indigo-700 hover:text-indigo-600">
          Create an account
        </Link>
      </p>
    </form>
  );
}
