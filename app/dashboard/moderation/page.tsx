import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Clock3, ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole, roleTitle } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

type ModerationPageProps = {
  searchParams?: Promise<{
    jpage?: string;
    apage?: string;
  }>;
};

async function ensureModeratorOrAdmin() {
  const sessionUser = await requireSessionUser();
  if (sessionUser.role === "MEMBER") {
    redirect("/dashboard/member");
  }
  return sessionUser;
}

async function approveJobAction(formData: FormData) {
  "use server";
  const sessionUser = await ensureModeratorOrAdmin();
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      isApproved: true,
      approvedById: sessionUser.userId,
    },
  });

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard/admin");
}

async function rejectJobAction(formData: FormData) {
  "use server";
  await ensureModeratorOrAdmin();
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard/admin");
}

async function approveAccomplishmentAction(formData: FormData) {
  "use server";
  const sessionUser = await ensureModeratorOrAdmin();
  const accomplishmentId = String(formData.get("accomplishmentId") ?? "");
  if (!accomplishmentId) return;

  await prisma.accomplishment.update({
    where: { id: accomplishmentId },
    data: {
      isApproved: true,
      approvedById: sessionUser.userId,
    },
  });

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard/admin");
}

async function rejectAccomplishmentAction(formData: FormData) {
  "use server";
  await ensureModeratorOrAdmin();
  const accomplishmentId = String(formData.get("accomplishmentId") ?? "");
  if (!accomplishmentId) return;

  await prisma.accomplishment.delete({
    where: { id: accomplishmentId },
  });

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard/admin");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function ModerationPage({ searchParams }: ModerationPageProps) {
  const sessionUser = await ensureModeratorOrAdmin();
  const resolvedSearchParams = await searchParams;
  const jpage = Math.max(Number(resolvedSearchParams?.jpage ?? "1") || 1, 1);
  const apage = Math.max(Number(resolvedSearchParams?.apage ?? "1") || 1, 1);
  const pageSize = 8;

  const [pendingJobsCount, pendingAccomplishmentsCount, pendingJobs, pendingAccomplishments] =
    await prisma.$transaction([
      prisma.job.count({
        where: {
          isApproved: false,
          isActive: true,
        },
      }),
      prisma.accomplishment.count({
        where: { isApproved: false },
      }),
      prisma.job.findMany({
        where: {
          isApproved: false,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          company: true,
          createdAt: true,
          poster: {
            select: {
              user: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (jpage - 1) * pageSize,
        take: pageSize,
      }),
      prisma.accomplishment.findMany({
        where: { isApproved: false },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          alumni: {
            select: {
              user: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (apage - 1) * pageSize,
        take: pageSize,
      }),
    ]);

  const navItems = navByRole[sessionUser.role];
  const pendingJobTotalPages = Math.max(Math.ceil(pendingJobsCount / pageSize), 1);
  const pendingAccTotalPages = Math.max(Math.ceil(pendingAccomplishmentsCount / pageSize), 1);

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Moderation</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{sessionUser.name ?? "Reviewer"}</p>
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
              <ShieldCheck className="size-7 text-indigo-600" />
              Moderation Workspace
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review and approve pending jobs and accomplishments in one focused screen.
            </p>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <StatCard label="Pending Jobs" value={pendingJobsCount} />
            <StatCard label="Pending Accomplishments" value={pendingAccomplishmentsCount} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card className="border-0 bg-white/85 shadow-lg shadow-indigo-100/50">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Pending Jobs Queue</CardTitle>
                <CardDescription>Approve or reject job postings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingJobs.length === 0 ? (
                  <EmptyRow text="No pending jobs right now." />
                ) : (
                  pendingJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-slate-100 bg-white/80 p-3">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {job.company ?? "Unknown company"} | by {job.poster.user.name ?? "Unknown member"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(job.createdAt)}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <form id={`approve-job-${job.id}`} action={approveJobAction}>
                          <input type="hidden" name="jobId" value={job.id} />
                        </form>
                        <ConfirmActionButton
                          formId={`approve-job-${job.id}`}
                          triggerLabel="Approve"
                          confirmLabel="Approve Job"
                          title="Approve Job Posting?"
                          description="This will publish the job to users."
                          triggerVariant="default"
                          triggerClassName="rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                        />

                        <form id={`reject-job-${job.id}`} action={rejectJobAction}>
                          <input type="hidden" name="jobId" value={job.id} />
                        </form>
                        <ConfirmActionButton
                          formId={`reject-job-${job.id}`}
                          triggerLabel="Reject"
                          confirmLabel="Reject Job"
                          title="Reject Job Posting?"
                          description="This will deactivate the job posting."
                          triggerVariant="outline"
                          triggerClassName="rounded-lg border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  ))
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-600">Page {jpage} of {pendingJobTotalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200 bg-white" disabled={jpage <= 1}>
                      <Link href={`/dashboard/moderation?jpage=${Math.max(jpage - 1, 1)}&apage=${apage}`}>Previous</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200 bg-white" disabled={jpage >= pendingJobTotalPages}>
                      <Link href={`/dashboard/moderation?jpage=${Math.min(jpage + 1, pendingJobTotalPages)}&apage=${apage}`}>Next</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/85 shadow-lg shadow-indigo-100/50">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Pending Accomplishments Queue</CardTitle>
                <CardDescription>Approve or reject feed submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAccomplishments.length === 0 ? (
                  <EmptyRow text="No pending accomplishments right now." />
                ) : (
                  pendingAccomplishments.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 bg-white/80 p-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.type.replaceAll("_", " ")} | by {item.alumni.user.name ?? "Unknown member"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <form id={`approve-acc-${item.id}`} action={approveAccomplishmentAction}>
                          <input type="hidden" name="accomplishmentId" value={item.id} />
                        </form>
                        <ConfirmActionButton
                          formId={`approve-acc-${item.id}`}
                          triggerLabel="Approve"
                          confirmLabel="Approve Achievement"
                          title="Approve Achievement?"
                          description="This will make the achievement visible in the feed."
                          triggerVariant="default"
                          triggerClassName="rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                        />

                        <form id={`reject-acc-${item.id}`} action={rejectAccomplishmentAction}>
                          <input type="hidden" name="accomplishmentId" value={item.id} />
                        </form>
                        <ConfirmActionButton
                          formId={`reject-acc-${item.id}`}
                          triggerLabel="Reject"
                          confirmLabel="Reject Achievement"
                          title="Reject Achievement?"
                          description="This action removes the submission."
                          triggerVariant="outline"
                          triggerClassName="rounded-lg border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  ))
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-600">Page {apage} of {pendingAccTotalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200 bg-white" disabled={apage <= 1}>
                      <Link href={`/dashboard/moderation?jpage=${jpage}&apage=${Math.max(apage - 1, 1)}`}>Previous</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200 bg-white" disabled={apage >= pendingAccTotalPages}>
                      <Link href={`/dashboard/moderation?jpage=${jpage}&apage=${Math.min(apage + 1, pendingAccTotalPages)}`}>Next</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-0 bg-white/85 shadow-lg shadow-indigo-100/50">
      <CardHeader className="pb-2">
        <CardDescription className="text-slate-500">{label}</CardDescription>
        <CardTitle className="text-3xl text-slate-900">{value.toLocaleString("en-US")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="flex items-center gap-1 text-xs text-slate-600">
          <Clock3 className="size-3" />
          Needs review
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
      {text}
    </div>
  );
}
