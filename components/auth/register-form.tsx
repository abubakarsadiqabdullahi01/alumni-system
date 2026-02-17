"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, GraduationCap, KeyRound, Mail, Phone, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const graduationYear = Number(String(formData.get("graduationYear") ?? "").trim());

    const payload = {
      name: String(formData.get("name") ?? ""),
      matricNo: String(formData.get("matricNo") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      department: String(formData.get("department") ?? ""),
      graduationYear,
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Registration failed");
        return;
      }

      toast.success("Registration successful");
      router.replace(result.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error while registering");
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
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <UserPlus className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="name"
              name="name"
              placeholder="Amina Bello"
              className="h-11 rounded-xl border-white/60 bg-white/80 pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="matricNo">Matric Number</Label>
          <div className="relative">
            <GraduationCap className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="matricNo"
              name="matricNo"
              placeholder="GSU/2018/12345"
              className="h-11 rounded-xl border-white/60 bg-white/80 pl-10"
              required
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
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
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="department"
              name="department"
              placeholder="Computer Science"
              className="h-11 rounded-xl border-white/60 bg-white/80 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="graduationYear">Graduation Year</Label>
          <Input
            id="graduationYear"
            name="graduationYear"
            type="number"
            min={1980}
            max={2100}
            placeholder="2018"
            className="h-11 rounded-xl border-white/60 bg-white/80"
            required
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="space-y-2"
      >
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+234..."
            className="h-11 rounded-xl border-white/60 bg-white/80 pl-10"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        className="space-y-2"
      >
        <Label htmlFor="password">Create Password</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-11 rounded-xl border-white/60 bg-white/80 pl-10"
            required
          />
        </div>
      </motion.div>

      <div className="flex items-start gap-2 text-sm text-slate-600">
        <Checkbox id="terms" required />
        <Label htmlFor="terms" className="font-normal leading-relaxed">
          I agree to the platform terms and community guidelines of GSU Gombe Alumni.
        </Label>
      </div>

      <Button
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold text-white hover:from-indigo-500 hover:to-purple-500"
      >
        {isSubmitting ? "Creating account..." : "Create My Alumni Account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-600">
          Login
        </Link>
      </p>
    </form>
  );
}

