import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { MemberActivityFeed } from "@/components/dashboard/member-activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { navByRole } from "@/components/dashboard/config";
import { requireSessionUser } from "@/lib/auth/server";
import { getMemberDashboardData } from "@/lib/dashboard/member";

export default async function MemberDashboardPage() {
  const sessionUser = await requireSessionUser();
  if (sessionUser.role !== "MEMBER") {
    if (sessionUser.role === "ADMIN") redirect("/dashboard/admin");
    redirect("/dashboard/moderator");
  }

  const data = await getMemberDashboardData(sessionUser.userId);
  const navItems = navByRole.MEMBER;

  const profileFields = [
    data.profile.department,
    data.profile.graduationYear?.toString() ?? null,
    data.profile.employer,
    data.profile.jobTitle,
    data.profile.city,
  ];
  const profileCompletedCount = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((profileCompletedCount / profileFields.length) * 100);
  const pendingCount = data.activity.filter((item) => item.status === "Pending").length;

  const recentActivity = data.activity.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    createdAtIso: item.createdAt.toISOString(),
    status: item.status,
  }));

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Member Access</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{data.profile.name}</p>
            <p className="text-sm text-slate-600">{data.profile.email}</p>
          </div>

          <div className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
            <DashboardNavLinks navItems={navItems} />
          </div>

          <Separator className="my-4 bg-white/70" />

          <LogoutButton className="mt-auto justify-start rounded-xl text-slate-700 hover:bg-white/70" />
        </aside>

        <section className="w-full pb-6">
          <header className="glass-panel sticky top-3 z-50 rounded-3xl p-4 backdrop-blur-2xl md:p-5">
            <Badge className="rounded-full border-0 bg-indigo-600 text-white">
              <Sparkles className="mr-1 size-3.5" />
              Premium Member Dashboard
            </Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Welcome back, {data.profile.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Your interactive alumni workspace for opportunities, achievements, and networking.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <InfoPill label="Profile Completion" value={`${profileCompletion}%`} />
              <InfoPill label="Pending Reviews" value={pendingCount.toLocaleString("en-US")} />
              <InfoPill label="Network Size" value={data.stats.networkSize.toLocaleString("en-US")} />
            </div>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <StatCard label="My Jobs Applied" value={data.stats.myJobsApplied} icon={Briefcase} />
            <StatCard label="My Accomplishments" value={data.stats.myAccomplishments} icon={Trophy} />
            <StatCard label="Network Size" value={data.stats.networkSize} icon={Users} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Quick Actions</CardTitle>
                <CardDescription>Fast actions for daily member workflows</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <QuickAction
                  href="/dashboard/post-job"
                  title="Post Job"
                  description="Create a new opportunity for alumni."
                  icon={Briefcase}
                />
                <QuickAction
                  href="/dashboard/share-achievement"
                  title="Share Achievement"
                  description="Publish your latest milestone."
                  icon={BadgeCheck}
                />
                <QuickAction
                  href="/dashboard/search"
                  title="Search Alumni"
                  description="Find classmates by department and year."
                  icon={Search}
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">My Profile</CardTitle>
                <CardDescription>Keep your identity complete and discoverable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-indigo-700">Profile Strength</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Completed {profileCompletedCount}/{profileFields.length} profile fields.
                  </p>
                </div>
                <p>
                  <span className="font-semibold text-slate-900">Department:</span>{" "}
                  {data.profile.department ?? "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Graduation Year:</span>{" "}
                  {data.profile.graduationYear ?? "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Employer:</span>{" "}
                  {data.profile.employer ?? "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Job Title:</span>{" "}
                  {data.profile.jobTitle ?? "Not set"}
                </p>
                <p className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-900">City:</span> {data.profile.city ?? "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Role:</span> Member
                </p>
                <Button asChild className="mt-2 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                  <Link href="/profile">
                    Open My Profile
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card id="activity" className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Recent Activity</CardTitle>
                <CardDescription>
                  Mixed feed from your jobs and accomplishments with live filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
                    No activity yet. Start by posting a job or sharing an accomplishment.
                  </p>
                ) : (
                  <MemberActivityFeed items={recentActivity} />
                )}
              </CardContent>
            </Card>

            <Card id="directory" className="border-0 bg-white/80 shadow-lg shadow-indigo-100/45">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Action Guidance</CardTitle>
                <CardDescription>Personalized next steps to maximize your dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ModuleRow
                  icon={CheckCircle2}
                  title="Complete Profile"
                  caption={
                    profileCompletion < 100
                      ? "Update missing profile fields to improve visibility in alumni search."
                      : "Your profile is complete and optimized for networking."
                  }
                />
                <ModuleRow
                  icon={Briefcase}
                  title="Jobs Pipeline"
                  caption="Track applications, monitor outcomes, and post opportunities."
                />
                <ModuleRow
                  icon={Trophy}
                  title="Achievement Visibility"
                  caption="Share milestones and keep your alumni presence active."
                />
                <ModuleRow icon={Users} title="Alumni Directory" caption="Search and connect with alumni." />
                <ModuleRow icon={CalendarDays} title="Events" caption="Join upcoming alumni events." />
                <ModuleRow icon={GraduationCap} title="Profile" caption="Keep your career details current." />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-0 bg-white/80 shadow-lg shadow-indigo-100/50">
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

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
    >
      <Icon className="size-4 text-indigo-600" />
      <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </Link>
  );
}

function ModuleRow({
  icon: Icon,
  title,
  caption,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/75 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-indigo-600" />
        <p className="font-medium text-slate-900">{title}</p>
      </div>
      <p className="mt-1 text-sm text-slate-600">{caption}</p>
    </div>
  );
}
