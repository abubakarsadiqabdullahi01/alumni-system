"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PostJobWizardProps = {
  canPost: boolean;
  autoApprove?: boolean;
};

const steps = ["Company", "Title", "Description", "Requirements"] as const;

export function PostJobWizard({ canPost, autoApprove = false }: PostJobWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    company: "",
    title: "",
    description: "",
    requirements: "",
    location: "",
    salaryRange: "",
    deadline: "",
  });

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep() {
    if (step === 1 && form.title.trim().length < 4) {
      toast.error("Title must be at least 4 characters.");
      return false;
    }
    if (step === 2 && form.description.trim().length < 20) {
      toast.error("Description must be at least 20 characters.");
      return false;
    }
    if (step === 3 && form.requirements.trim().length === 0) {
      toast.error("Please add basic requirements.");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!canPost) return;
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Unable to submit job");
        return;
      }

      toast.success(result.message ?? "Job submitted");
      router.push("/dashboard/my-jobs");
      router.refresh();
    } catch {
      toast.error("Network error while submitting job");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-0 bg-white/85 shadow-xl shadow-indigo-100/50">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-900">Post Job</CardTitle>
        <CardDescription>Multi-step workflow with enterprise moderation</CardDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <Badge
              key={label}
              className={
                index === step
                  ? "rounded-full border-0 bg-indigo-600 text-white"
                  : "rounded-full border border-slate-200 bg-white text-slate-600"
              }
            >
              {index + 1}. {label}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {autoApprove
            ? "Admin publish mode: your job will be auto-approved immediately after submission."
            : "Admin approval notice: every posted job is reviewed before it becomes publicly active."}
        </div>

        {step === 0 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="company">
              Company
            </label>
            <Input
              id="company"
              value={form.company}
              onChange={(event) => updateField("company", event.target.value)}
              placeholder="e.g. Interswitch"
              className="h-11 rounded-xl border-white/80 bg-white/80"
              disabled={!canPost}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Job Title
            </label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Senior Backend Engineer"
              className="h-11 rounded-xl border-white/80 bg-white/80"
              disabled={!canPost}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Describe role scope, impact, and expectations..."
              className="min-h-36 w-full rounded-xl border border-white/80 bg-white/80 p-3 text-sm"
              disabled={!canPost}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="requirements">
              Requirements
            </label>
            <textarea
              id="requirements"
              value={form.requirements}
              onChange={(event) => updateField("requirements", event.target.value)}
              placeholder="List technical and non-technical requirements..."
              className="min-h-32 w-full rounded-xl border border-white/80 bg-white/80 p-3 text-sm"
              disabled={!canPost}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder="Location"
                className="h-11 rounded-xl border-white/80 bg-white/80"
                disabled={!canPost}
              />
              <Input
                value={form.salaryRange}
                onChange={(event) => updateField("salaryRange", event.target.value)}
                placeholder="Salary range"
                className="h-11 rounded-xl border-white/80 bg-white/80"
                disabled={!canPost}
              />
              <Input
                type="date"
                value={form.deadline}
                onChange={(event) => updateField("deadline", event.target.value)}
                className="h-11 rounded-xl border-white/80 bg-white/80"
                disabled={!canPost}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0 || isSubmitting}
            className="rounded-xl border-slate-200 bg-white"
          >
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => {
                if (!validateStep()) return;
                setStep((prev) => Math.min(steps.length - 1, prev + 1));
              }}
              disabled={!canPost || isSubmitting}
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canPost || isSubmitting}
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {isSubmitting ? "Submitting..." : autoApprove ? "Post Job Now" : "Submit Job for Approval"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
