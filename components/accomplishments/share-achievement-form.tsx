"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const achievementTypes = [
  { value: "PROMOTION", label: "Promotion" },
  { value: "NEW_EMPLOYMENT", label: "New Employment" },
  { value: "WEDDING", label: "Wedding" },
  { value: "BIRTH", label: "Birth" },
  { value: "OTHER", label: "Other" },
] as const;

export function ShareAchievementForm({ canSubmit }: { canSubmit: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "PROMOTION",
    title: "",
    description: "",
    imageUrl: "",
    date: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const title = form.title.trim();
    const description = form.description.trim();
    const imageUrl = form.imageUrl.trim();

    if (title.length < 4) {
      setErrorText("Title must be at least 4 characters.");
      return;
    }
    if (description.length > 0 && description.length < 10) {
      setErrorText("Description must be at least 10 characters when provided.");
      return;
    }
    if (imageUrl.length > 0) {
      try {
        new URL(imageUrl);
      } catch {
        setErrorText("Image URL must be a valid URL.");
        return;
      }
    }

    setErrorText(null);
    setIsSubmitting(true);
    try {
      const payload = {
        type: form.type,
        title,
        description: description.length > 0 ? description : null,
        imageUrl: imageUrl.length > 0 ? imageUrl : null,
        date: form.date || null,
      };

      const response = await fetch("/api/accomplishments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        if (result?.issues?.fieldErrors) {
          const firstError = Object.values(result.issues.fieldErrors)
            .flat()
            .find((message) => typeof message === "string");
          if (firstError) {
            setErrorText(firstError);
          }
        }
        toast.error(result.error ?? "Unable to submit achievement");
        return;
      }

      toast.success(result.message ?? "Achievement submitted");
      router.push("/dashboard/member");
      router.refresh();
    } catch {
      toast.error("Network error while submitting achievement");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-0 bg-white/85 shadow-xl shadow-indigo-100/50">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-900">Share Achievement</CardTitle>
        <CardDescription>Submit your update for review and publication</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
          Professional tip: include a clear title and short context so your achievement gets approved faster.
        </div>
        {errorText ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {errorText}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="type">
                Achievement Type
              </label>
              <select
                id="type"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                disabled={!canSubmit}
              >
                {achievementTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="date">
                Date (Optional)
              </label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="h-11 rounded-xl border-white/80 bg-white/80"
                disabled={!canSubmit}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Promotion to Senior Engineering Manager"
              className="h-11 rounded-xl border-white/80 bg-white/80"
              disabled={!canSubmit}
              required
            />
            <p className="text-xs text-slate-500">{form.title.trim().length}/180</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Share context of your achievement..."
              className="min-h-28 w-full rounded-xl border border-white/80 bg-white/80 p-3 text-sm"
              disabled={!canSubmit}
            />
            <p className="text-xs text-slate-500">Optional, but minimum 10 characters if provided.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="imageUrl">
              Image URL (Optional)
            </label>
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              placeholder="https://..."
              className="h-11 rounded-xl border-white/80 bg-white/80"
              disabled={!canSubmit}
            />
            <p className="text-xs text-slate-500">Paste a full public URL (https://...).</p>
          </div>
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {isSubmitting ? "Submitting..." : "Submit Achievement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
