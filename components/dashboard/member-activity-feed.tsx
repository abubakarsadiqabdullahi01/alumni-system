"use client";

import { useMemo, useState } from "react";
import { Briefcase, CheckCircle2, Clock3, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type MemberActivityFeedItem = {
  id: string;
  type: "JOB" | "ACCOMPLISHMENT";
  title: string;
  subtitle: string;
  createdAtIso: string;
  status: string;
};

export function MemberActivityFeed({ items }: { items: MemberActivityFeedItem[] }) {
  const [tab, setTab] = useState<"ALL" | "JOB" | "ACCOMPLISHMENT">("ALL");
  const [pendingOnly, setPendingOnly] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (tab !== "ALL" && item.type !== tab) return false;
      if (pendingOnly && item.status !== "Pending") return false;
      return true;
    });
  }, [items, pendingOnly, tab]);

  const totalPending = items.filter((item) => item.status === "Pending").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton label="All" active={tab === "ALL"} onClick={() => setTab("ALL")} />
          <TabButton label="Jobs" active={tab === "JOB"} onClick={() => setTab("JOB")} />
          <TabButton
            label="Achievements"
            active={tab === "ACCOMPLISHMENT"}
            onClick={() => setTab("ACCOMPLISHMENT")}
          />
        </div>
        <button
          type="button"
          onClick={() => setPendingOnly((prev) => !prev)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            pendingOnly
              ? "border-amber-300 bg-amber-100 text-amber-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Pending only {totalPending > 0 ? `(${totalPending})` : ""}
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
          No items match your current filters.
        </p>
      ) : (
        filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-100 bg-white/80 p-3 transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 rounded-lg bg-indigo-100 p-1.5 text-indigo-700">
                  {item.type === "JOB" ? <Briefcase className="size-4" /> : <Trophy className="size-4" />}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.subtitle}</p>
                </div>
              </div>
              <Badge
                className={
                  item.status === "Approved"
                    ? "rounded-full border-0 bg-emerald-600 text-white"
                    : "rounded-full border-0 bg-amber-500 text-white"
                }
              >
                {item.status}
              </Badge>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" />
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(item.createdAtIso))}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                {item.type === "JOB" ? "Job flow" : "Achievement flow"}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? "border-indigo-500 bg-indigo-600 text-white shadow"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
      }`}
    >
      {label}
    </button>
  );
}

