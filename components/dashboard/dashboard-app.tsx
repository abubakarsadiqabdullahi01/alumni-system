"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole, roleTitle } from "@/components/dashboard/config";
import type { UserRole } from "@/components/dashboard/types";

type DashboardAppProps = {
  role: UserRole;
  displayName?: string | null;
};

const statsByRole: Record<UserRole, Array<{ label: string; value: string; trend: string }>> = {
  ADMIN: [
    { label: "Total Alumni", value: "10,482", trend: "+4.1%" },
    { label: "Active Jobs", value: "512", trend: "+7.3%" },
    { label: "Pending Moderation", value: "8", trend: "-12%" },
    { label: "Monthly Engagement", value: "78%", trend: "+3.8%" },
  ],
  MODERATOR: [
    { label: "Queue Size", value: "8", trend: "-12%" },
    { label: "Reviewed Today", value: "21", trend: "+19%" },
    { label: "Pending Jobs", value: "3", trend: "-25%" },
    { label: "Pending Achievements", value: "5", trend: "-9%" },
  ],
  MEMBER: [
    { label: "My Network", value: "248", trend: "+6%" },
    { label: "Recommended Jobs", value: "12", trend: "+2" },
    { label: "Profile Views", value: "1,142", trend: "+10%" },
    { label: "Achievements", value: "7", trend: "+1" },
  ],
};

const quickDirectory = [
  { name: "Aisha Umar", dept: "Computer Science", year: 2018, city: "Gombe" },
  { name: "Sani Lawal", dept: "Business Admin", year: 2017, city: "Abuja" },
  { name: "Maryam Musa", dept: "Public Health", year: 2019, city: "Lagos" },
];

const jobPlaceholders = [
  { title: "Product Analyst", company: "Sterling Bank", location: "Abuja", status: "Open" },
  { title: "Software Engineer", company: "Moniepoint", location: "Remote", status: "Open" },
  { title: "Operations Lead", company: "Andela", location: "Lagos", status: "Closing Soon" },
];

const moderationItems = [
  { type: "Job Post", title: "Senior Backend Engineer - Interswitch", age: "12m ago" },
  { type: "Achievement", title: "Promotion: Head of Operations", age: "22m ago" },
  { type: "Achievement", title: "New Employment at NNPC", age: "40m ago" },
];

export function DashboardApp({ role, displayName }: DashboardAppProps) {
  const navItems = navByRole[role];

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 rounded-2xl bg-white/75 p-3">
            <Image src="/images/brand/gsu-mark.png" alt="GSU Mark" width={38} height={38} className="rounded-xl" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">GOMBE STATE UNIVERSITY</p>
              <p className="text-sm font-semibold text-slate-900">GSU Gombe Alumni</p>
            </div>
          </Link>

          <div className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
            <DashboardNavLinks navItems={navItems} />
          </div>

          <Separator className="my-4 bg-white/70" />

          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-4 text-white shadow-xl">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-100">Current Role</p>
            <p className="mt-2 text-lg font-semibold">{roleTitle[role]}</p>
            <p className="mt-1 text-sm text-indigo-100">Role-based modules are active.</p>
          </div>

          <LogoutButton className="mt-auto justify-start rounded-xl text-slate-700 hover:bg-white/70" />
        </aside>

        <section className="w-full pb-3">
          <header className="glass-panel sticky top-3 z-50 rounded-3xl p-4 backdrop-blur-2xl md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge className="rounded-full border-0 bg-indigo-600 text-white">
                  <Sparkles className="mr-1 size-3.5" />
                  Premium Dashboard
                </Badge>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{roleTitle[role]}</h1>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  Welcome, {displayName?.trim() || "Alumni User"}.
                </p>
                <p className="text-sm text-slate-600">Your enterprise control center is pinned while you scroll.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl border-white/80 bg-white/75">
                  <Search className="size-4" />
                  Search
                </Button>
                <Button variant="outline" className="rounded-xl border-white/80 bg-white/75">
                  <Bell className="size-4" />
                  Alerts
                </Button>
                <Avatar className="size-10 border-2 border-white">
                  <AvatarImage src="/images/avatars/alumni-1.jpeg" alt="Admin profile" />
                  <AvatarFallback>GS</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <RoleChip label="Member Access" active={role === "MEMBER"} />
              <RoleChip label="Moderator Access" active={role === "MODERATOR"} />
              <RoleChip label="Admin Access" active={role === "ADMIN"} />
            </div>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statsByRole[role].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
              >
                <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-500">{stat.label}</CardDescription>
                    <CardTitle className="text-3xl text-slate-900">{stat.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="rounded-full border-0 bg-emerald-600/90 text-white">{stat.trend}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Global Directory Snapshot</CardTitle>
                <CardDescription>Placeholder data until live API integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickDirectory.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/75 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{row.name}</p>
                      <p className="text-sm text-slate-600">
                        {row.dept} | {row.year}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {row.city}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Recent Activity</CardTitle>
                <CardDescription>Live-feed placeholder cards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Activity title="New alumni registration approved" time="5 min ago" icon="ok" />
                <Activity title="Job posted: Senior Product Manager" time="18 min ago" icon="ok" />
                <Activity title="Achievement awaiting review" time="30 min ago" icon="warn" />
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Exclusive Job Board</CardTitle>
                <CardDescription>Premium career opportunities for GSU alumni</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {jobPlaceholders.map((job) => (
                  <div key={job.title} className="rounded-xl border border-slate-100 bg-white/75 p-3">
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="text-sm text-slate-600">
                      {job.company} | {job.location}
                    </p>
                    <Badge className="mt-2 rounded-full border-0 bg-indigo-600 text-white">{job.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Achievements & Recognition</CardTitle>
                <CardDescription>Social module placeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-slate-100 bg-white/75 p-3">
                  <p className="font-medium text-slate-900">Promotion: Head of Data at Flutterwave</p>
                  <p className="mt-1 text-sm text-slate-600">Posted by Nura Hamza | 2h ago</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white/75 p-3">
                  <p className="font-medium text-slate-900">New Employment: Project Manager at NNPC</p>
                  <p className="mt-1 text-sm text-slate-600">Posted by Fatima Usman | 4h ago</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white/75 p-3">
                  <p className="font-medium text-slate-900">Community Award: Distinguished Alumni 2026</p>
                  <p className="mt-1 text-sm text-slate-600">Posted by Alumni Office | 1d ago</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {(role === "ADMIN" || role === "MODERATOR") && (
            <Card className="mt-4 border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Moderation Queue</CardTitle>
                <CardDescription>Role-only controls and review placeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {moderationItems.map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/75 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {item.age}
                      </Badge>
                      <Button size="sm" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg border-slate-200 bg-white">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}

function Activity({
  title,
  time,
  icon,
}: {
  title: string;
  time: string;
  icon: "ok" | "warn";
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white/75 p-3">
      <span className="mt-0.5">
        {icon === "ok" ? (
          <CheckCircle2 className="size-4 text-emerald-600" />
        ) : (
          <ShieldAlert className="size-4 text-amber-600" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
          <Clock3 className="size-3" />
          {time}
        </p>
      </div>
    </div>
  );
}

function RoleChip({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <Badge
      className={
        active
          ? "rounded-full border-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-white"
          : "rounded-full border border-white/70 bg-white/80 px-3 py-1 text-slate-600"
      }
    >
      {label}
      <ChevronRight className="ml-1 size-3.5" />
    </Badge>
  );
}
