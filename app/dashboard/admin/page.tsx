import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

async function ensureAdmin() {
  const sessionUser = await requireSessionUser();
  if (sessionUser.role !== "ADMIN") {
    if (sessionUser.role === "MODERATOR") redirect("/dashboard/moderator");
    redirect("/dashboard/member");
  }
  return sessionUser;
}

export default async function AdminDashboardPage() {
  const sessionUser = await ensureAdmin();
  const navItems = navByRole.ADMIN;

  const [
    totalUsers,
    totalAlumni,
    verifiedUsers,
    activeJobs,
    pendingJobs,
    pendingAccomplishments,
    moderators,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.alumni.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.job.count({ where: { isActive: true } }),
    prisma.job.count({ where: { isApproved: false, isActive: true } }),
    prisma.accomplishment.count({ where: { isApproved: false } }),
    prisma.user.count({ where: { OR: [{ role: "ADMIN" }, { role: "MODERATOR" }] } }),
  ]);

  const pendingTotal = pendingJobs + pendingAccomplishments;

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Administrator</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{sessionUser.name ?? "Admin User"}</p>
            <p className="text-sm text-slate-600">{sessionUser.email ?? ""}</p>
          </div>

          <div className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
            <DashboardNavLinks navItems={navItems} />
          </div>

          <Separator className="my-4 bg-white/70" />
          <LogoutButton className="mt-auto justify-start rounded-xl text-slate-700 hover:bg-white/70" />
        </aside>

        <section className="w-full pb-6">
          <header className="glass-panel sticky top-3 z-50 rounded-3xl p-4 backdrop-blur-2xl md:p-5">
            <Badge className="rounded-full border-0 bg-indigo-600 text-white">Enterprise Admin Console</Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Welcome, {sessionUser.name ?? "Administrator"}.
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Clean executive overview with direct access to every admin workspace.
            </p>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={totalUsers} icon={Users} accent="from-indigo-600 to-cyan-500" />
            <StatCard label="Verified Users" value={verifiedUsers} icon={UserCheck} accent="from-emerald-600 to-teal-500" />
            <StatCard label="Active Jobs" value={activeJobs} icon={Briefcase} accent="from-blue-600 to-indigo-600" />
            <StatCard label="Pending Moderation" value={pendingTotal} icon={ShieldCheck} accent="from-amber-500 to-rose-500" />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Operations Hub</CardTitle>
                <CardDescription>Dedicated workspaces for focused admin operations</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <WorkspaceCard
                  title="Moderation Queue"
                  description="Approve or reject pending jobs and accomplishments."
                  href="/dashboard/moderation"
                  icon={ShieldCheck}
                />
                <WorkspaceCard
                  title="Member Management"
                  description="Manage roles, verification, status, and profile creation."
                  href="/dashboard/admin/members"
                  icon={Users}
                />
                <WorkspaceCard
                  title="Search Alumni"
                  description="Run advanced filters and export high-quality datasets."
                  href="/dashboard/search"
                  icon={BarChart3}
                />
                <WorkspaceCard
                  title="Reports"
                  description="Open analytics dashboard with trends and exports."
                  href="/dashboard/admin/reports"
                  icon={BarChart3}
                />
                <WorkspaceCard
                  title="System Settings"
                  description="Configure access, moderation policies, and security actions."
                  href="/dashboard/admin/settings"
                  icon={ShieldCheck}
                />
                <WorkspaceCard
                  title="Jobs Workspace"
                  description="Publish jobs, track postings, and monitor applications."
                  href="/dashboard/my-jobs"
                  icon={Briefcase}
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">System Snapshot</CardTitle>
                <CardDescription>Production readiness indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <HealthChip label="Alumni Records" value={totalAlumni.toLocaleString("en-US")} ok />
                <HealthChip label="Admin/Moderators" value={moderators.toLocaleString("en-US")} ok />
                <HealthChip label="Pending Jobs" value={pendingJobs.toLocaleString("en-US")} ok={pendingJobs < 50} />
                <HealthChip
                  label="Pending Accomplishments"
                  value={pendingAccomplishments.toLocaleString("en-US")}
                  ok={pendingAccomplishments < 100}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Quick Actions</CardTitle>
              <CardDescription>Frequently used admin actions</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                <Link href="/dashboard/moderation">Open Moderation</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href="/dashboard/admin/reports">Open Reports</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href="/dashboard/admin/members">Manage Members</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href="/dashboard/admin/settings">System Settings</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href="/profile">My Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden border-0 bg-white/90 shadow-[0_22px_48px_-26px_rgba(37,99,235,0.55)]">
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
      <CardHeader className="pb-2">
        <CardDescription className="text-slate-500">{label}</CardDescription>
        <CardTitle className="text-3xl text-slate-900">{value.toLocaleString("en-US")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Icon className="size-4 text-indigo-600" />
      </CardContent>
    </Card>
  );
}

function WorkspaceCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <Icon className="size-5 text-indigo-600" />
        <ArrowRight className="size-4 text-slate-400" />
      </div>
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  );
}

function HealthChip({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-1 font-medium ${ok ? "text-emerald-700" : "text-amber-700"}`}>{value}</p>
    </div>
  );
}
