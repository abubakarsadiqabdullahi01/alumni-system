import Link from "next/link";
import { Briefcase, Clock3 } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole, roleTitle } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

type MyJobsPageProps = {
  searchParams?: Promise<{
    tab?: "all" | "posted" | "applied";
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function MyJobsPage({ searchParams }: MyJobsPageProps) {
  const sessionUser = await requireSessionUser();
  const navItems = navByRole[sessionUser.role];
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams?.tab === "posted" || resolvedSearchParams?.tab === "applied"
    ? resolvedSearchParams.tab
    : "all";

  const alumni = await prisma.alumni.findUnique({
    where: { userId: sessionUser.userId },
    select: { id: true },
  });

  const allJobs = await prisma.job.findMany({
    where:
      sessionUser.role === "ADMIN"
        ? undefined
        : {
            isApproved: true,
            isActive: true,
          },
    select: {
      id: true,
      title: true,
      company: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      posterId: true,
      poster: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      applications: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const [postedJobs, appliedJobs] = alumni
    ? await prisma.$transaction([
        prisma.job.findMany({
          where: { posterId: alumni.id },
          select: {
            id: true,
            title: true,
            company: true,
            isApproved: true,
            isActive: true,
            createdAt: true,
            applications: {
              select: { id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        prisma.jobApplication.findMany({
          where: { applicantId: alumni.id },
          select: {
            id: true,
            status: true,
            createdAt: true,
            job: {
              select: {
                title: true,
                company: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      ])
    : [[], []];

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">My Jobs</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{sessionUser.name ?? "User"}</p>
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
            <Badge className="rounded-full border-0 bg-indigo-600 text-white">{roleTitle[sessionUser.role]}</Badge>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              <Briefcase className="size-7 text-indigo-600" />
              My Jobs Workspace
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Posted jobs, applied jobs, and live application status tracking.
            </p>
          </header>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button asChild variant={tab === "all" ? "default" : "outline"} className={tab === "all" ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
              <Link href="/dashboard/my-jobs?tab=all">All Jobs</Link>
            </Button>
            <Button asChild variant={tab === "posted" ? "default" : "outline"} className={tab === "posted" ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
              <Link href="/dashboard/my-jobs?tab=posted">My Posted Jobs</Link>
            </Button>
            <Button asChild variant={tab === "applied" ? "default" : "outline"} className={tab === "applied" ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
              <Link href="/dashboard/my-jobs?tab=applied">My Applications</Link>
            </Button>
          </div>

          <Card className="mt-4 border-0 bg-white/85 shadow-lg shadow-indigo-100/50">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">
                {tab === "all" ? "All Jobs" : tab === "posted" ? "My Posted Jobs" : "My Applications"}
              </CardTitle>
              <CardDescription>
                {tab === "all"
                  ? "All jobs posted by users, with marker for your own posts."
                  : tab === "posted"
                    ? "My postings and moderation/active status."
                    : "My job applications and current status tracking."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tab === "all" ? (
                allJobs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-sm text-slate-600">
                    No jobs found.
                  </p>
                ) : (
                  allJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-slate-100 bg-white/80 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <div className="flex items-center gap-2">
                          {alumni && job.posterId === alumni.id ? (
                            <Badge className="rounded-full border-0 bg-indigo-600 text-white">My Post</Badge>
                          ) : null}
                          <Badge
                            className={
                              job.isApproved
                                ? "rounded-full border-0 bg-emerald-600 text-white"
                                : "rounded-full border-0 bg-amber-500 text-white"
                            }
                          >
                            {job.isApproved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {job.company ?? "Unknown company"} | by {job.poster.user.name ?? "Unknown user"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(job.createdAt)}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                        <Clock3 className="size-3" />
                        {job.isActive ? "Active posting" : "Inactive posting"} | {job.applications.length} applications
                      </p>
                    </div>
                  ))
                )
              ) : null}

              {tab === "posted" ? (
                !alumni ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-sm text-slate-600">
                    No alumni profile found, so posted jobs are unavailable.
                  </p>
                ) : postedJobs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-sm text-slate-600">
                    No posted jobs yet.
                  </p>
                ) : (
                  postedJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-slate-100 bg-white/80 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <Badge
                          className={
                            job.isApproved
                              ? "rounded-full border-0 bg-emerald-600 text-white"
                              : "rounded-full border-0 bg-amber-500 text-white"
                          }
                        >
                          {job.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{job.company ?? "Unknown company"}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(job.createdAt)}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                        <Clock3 className="size-3" />
                        {job.isActive ? "Active posting" : "Inactive posting"} | {job.applications.length} applications
                      </p>
                    </div>
                  ))
                )
              ) : null}

              {tab === "applied" ? (
                !alumni ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-sm text-slate-600">
                    No alumni profile found, so applications are unavailable.
                  </p>
                ) : appliedJobs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-sm text-slate-600">
                    No applications yet.
                  </p>
                ) : (
                  appliedJobs.map((application) => (
                    <div key={application.id} className="rounded-xl border border-slate-100 bg-white/80 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{application.job.title}</p>
                        <Badge
                          className={
                            application.status === "ACCEPTED"
                              ? "rounded-full border-0 bg-emerald-600 text-white"
                              : application.status === "REJECTED"
                                ? "rounded-full border-0 bg-rose-600 text-white"
                                : application.status === "REVIEWED"
                                  ? "rounded-full border-0 bg-indigo-600 text-white"
                                  : "rounded-full border-0 bg-amber-500 text-white"
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{application.job.company ?? "Unknown company"}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(application.createdAt)}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        Job status: {application.job.isActive ? "Active" : "Closed"}
                      </p>
                    </div>
                  ))
                )
              ) : null}
            </CardContent>
          </Card>

          <div className="mt-4">
            <Button asChild className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
              <Link href="/dashboard/post-job">Post New Job</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
