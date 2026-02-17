import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Download,
  FileSpreadsheet,
  TrendingUp,
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

type AdminReportsPageProps = {
  searchParams?: Promise<{ range?: string }>;
};

async function ensureAdmin() {
  const sessionUser = await requireSessionUser();
  if (sessionUser.role !== "ADMIN") {
    if (sessionUser.role === "MODERATOR") redirect("/dashboard/moderator");
    redirect("/dashboard/member");
  }
  return sessionUser;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const sessionUser = await ensureAdmin();
  const navItems = navByRole.ADMIN;
  const resolved = await searchParams;
  const range = resolved?.range === "7" || resolved?.range === "90" ? Number(resolved.range) : 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (range - 1));

  const [
    totalUsers,
    totalAlumni,
    verifiedUsers,
    activeJobs,
    pendingJobs,
    pendingAccomplishments,
    totalApplications,
    applicationByStatus,
    roleDistribution,
    statusDistribution,
    topDepartments,
    topEmployers,
    dailyRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.alumni.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.job.count({ where: { isActive: true } }),
    prisma.job.count({ where: { isApproved: false, isActive: true } }),
    prisma.accomplishment.count({ where: { isApproved: false } }),
    prisma.jobApplication.count(),
    prisma.jobApplication.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.alumni.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.alumni.groupBy({
      by: ["department"],
      _count: { _all: true },
      orderBy: { _count: { department: "desc" } },
      take: 6,
    }),
    prisma.alumni.groupBy({
      by: ["employer"],
      where: { employer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { employer: "desc" } },
      take: 6,
    }),
    prisma.$queryRaw<Array<{ day: Date; users: bigint; jobs: bigint; applications: bigint; accomplishments: bigint }>>`
      WITH days AS (
        SELECT generate_series(${start}::date, CURRENT_DATE, INTERVAL '1 day')::date AS day
      )
      SELECT
        d.day AS day,
        COALESCE(u.users, 0) AS users,
        COALESCE(j.jobs, 0) AS jobs,
        COALESCE(a.applications, 0) AS applications,
        COALESCE(c.accomplishments, 0) AS accomplishments
      FROM days d
      LEFT JOIN (
        SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS users
        FROM "User"
        WHERE "createdAt" >= ${start}
        GROUP BY DATE("createdAt")
      ) u ON d.day = u.day
      LEFT JOIN (
        SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS jobs
        FROM "jobs"
        WHERE "createdAt" >= ${start}
        GROUP BY DATE("createdAt")
      ) j ON d.day = j.day
      LEFT JOIN (
        SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS applications
        FROM "job_applications"
        WHERE "createdAt" >= ${start}
        GROUP BY DATE("createdAt")
      ) a ON d.day = a.day
      LEFT JOIN (
        SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS accomplishments
        FROM "accomplishments"
        WHERE "createdAt" >= ${start}
        GROUP BY DATE("createdAt")
      ) c ON d.day = c.day
      ORDER BY d.day ASC
    `,
  ]);

  const maxSeriesValue = Math.max(
    1,
    ...dailyRows.flatMap((row) => [
      Number(row.users),
      Number(row.jobs),
      Number(row.applications),
      Number(row.accomplishments),
    ]),
  );

  const exportHref = `/api/admin/reports/export?range=${range}`;

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Reports</p>
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
            <Badge className="rounded-full border-0 bg-indigo-600 text-white">Analytics Workspace</Badge>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              <FileSpreadsheet className="size-7 text-indigo-600" />
              Admin Reports
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Data-driven reporting across users, jobs, applications, and alumni activity.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild variant={range === 7 ? "default" : "outline"} className={range === 7 ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
                <Link href="/dashboard/admin/reports?range=7">Last 7d</Link>
              </Button>
              <Button asChild variant={range === 30 ? "default" : "outline"} className={range === 30 ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
                <Link href="/dashboard/admin/reports?range=30">Last 30d</Link>
              </Button>
              <Button asChild variant={range === 90 ? "default" : "outline"} className={range === 90 ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
                <Link href="/dashboard/admin/reports?range=90">Last 90d</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href={exportHref}>
                  <Download className="size-4" />
                  Export CSV
                </Link>
              </Button>
            </div>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total Users" value={totalUsers} icon={Users} />
            <MetricCard label="Verified Users" value={verifiedUsers} icon={UserCheck} />
            <MetricCard label="Active Jobs" value={activeJobs} icon={Briefcase} />
            <MetricCard label="Applications" value={totalApplications} icon={BarChart3} />
            <MetricCard label="Backlog" value={pendingJobs + pendingAccomplishments} icon={TrendingUp} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Daily Trends ({range} days)</CardTitle>
                <CardDescription>Users, jobs, applications, accomplishments by day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dailyRows.map((row) => {
                  const users = Number(row.users);
                  const jobs = Number(row.jobs);
                  const applications = Number(row.applications);
                  const accomplishments = Number(row.accomplishments);
                  return (
                    <div key={new Date(row.day).toISOString()} className="rounded-xl border border-slate-100 bg-white/80 p-2.5">
                      <p className="text-xs font-medium text-slate-600">
                        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(row.day))}
                      </p>
                      <div className="mt-2 grid gap-1">
                        <SeriesBar label="Users" value={users} max={maxSeriesValue} color="bg-indigo-500" />
                        <SeriesBar label="Jobs" value={jobs} max={maxSeriesValue} color="bg-blue-500" />
                        <SeriesBar label="Applications" value={applications} max={maxSeriesValue} color="bg-emerald-500" />
                        <SeriesBar label="Accomplishments" value={accomplishments} max={maxSeriesValue} color="bg-amber-500" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Operational Breakdown</CardTitle>
                <CardDescription>Distribution by role, status, and moderation queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <MetricRow label="Total Alumni" value={formatNumber(totalAlumni)} />
                <MetricRow label="Pending Jobs" value={formatNumber(pendingJobs)} />
                <MetricRow label="Pending Accomplishments" value={formatNumber(pendingAccomplishments)} />
                <Separator />
                {roleDistribution.map((row) => (
                  <MetricRow key={row.role} label={`Role: ${row.role}`} value={formatNumber(row._count._all)} />
                ))}
                <Separator />
                {statusDistribution.map((row) => (
                  <MetricRow key={row.status} label={`Member: ${row.status}`} value={formatNumber(row._count._all)} />
                ))}
                <Separator />
                {applicationByStatus.map((row) => (
                  <MetricRow key={row.status} label={`Applications: ${row.status}`} value={formatNumber(row._count._all)} />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Top Departments</CardTitle>
                <CardDescription>By alumni volume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topDepartments.length === 0 ? (
                  <p className="text-sm text-slate-600">No department data.</p>
                ) : (
                  topDepartments.map((row) => (
                    <div key={row.department} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{row.department}</p>
                      <Badge className="rounded-full border-0 bg-indigo-600 text-white">{formatNumber(row._count._all)}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Top Employers</CardTitle>
                <CardDescription>By alumni affiliation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topEmployers.length === 0 ? (
                  <p className="text-sm text-slate-600">No employer data.</p>
                ) : (
                  topEmployers.map((row) => (
                    <div key={row.employer ?? "unknown"} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{row.employer ?? "Unknown"}</p>
                      <Badge className="rounded-full border-0 bg-indigo-600 text-white">{formatNumber(row._count._all)}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-0 bg-white/90 shadow-[0_22px_48px_-26px_rgba(37,99,235,0.55)]">
      <CardHeader className="pb-2">
        <CardDescription className="text-slate-500">{label}</CardDescription>
        <CardTitle className="text-3xl text-slate-900">{formatNumber(value)}</CardTitle>
      </CardHeader>
      <CardContent>
        <Icon className="size-4 text-indigo-600" />
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2">
      <p className="text-sm text-slate-700">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SeriesBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const widthPercent = Math.max(6, Math.round((value / max) * 100));
  return (
    <div className="grid grid-cols-[100px_1fr_52px] items-center gap-2 text-xs">
      <span className="text-slate-600">{label}</span>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${widthPercent}%` }} />
      </div>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}
