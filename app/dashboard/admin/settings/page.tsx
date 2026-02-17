import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ShieldCheck, SlidersHorizontal, UserCog } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import {
  defaultSystemSettings,
  getSystemSettings,
  saveSystemSettings,
  type SystemSettings,
} from "@/lib/admin/system-settings";
import { prisma } from "@/lib/prisma";

async function ensureAdmin() {
  const sessionUser = await requireSessionUser();
  if (sessionUser.role !== "ADMIN") {
    if (sessionUser.role === "MODERATOR") redirect("/dashboard/moderator");
    redirect("/dashboard/member");
  }
  return sessionUser;
}

function getCheckbox(formData: FormData, key: keyof SystemSettings) {
  return formData.get(String(key)) === "on";
}

async function updateSystemSettingsAction(formData: FormData) {
  "use server";
  await ensureAdmin();
  const settings: SystemSettings = {
    allowPublicRegistration: getCheckbox(formData, "allowPublicRegistration"),
    defaultNewUserVerified: getCheckbox(formData, "defaultNewUserVerified"),
    maintenanceMode: getCheckbox(formData, "maintenanceMode"),
    requireApprovalForJobs: getCheckbox(formData, "requireApprovalForJobs"),
    requireApprovalForAccomplishments: getCheckbox(formData, "requireApprovalForAccomplishments"),
    adminAutoApproveOwnContent: getCheckbox(formData, "adminAutoApproveOwnContent"),
  };

  await saveSystemSettings(settings);
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/dashboard/admin");
}

async function resetSystemSettingsAction() {
  "use server";
  await ensureAdmin();
  await saveSystemSettings(defaultSystemSettings);
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/dashboard/admin");
}

async function revokeOtherSessionsAction() {
  "use server";
  const sessionUser = await ensureAdmin();
  await prisma.session.deleteMany({
    where: {
      userId: {
        not: sessionUser.userId,
      },
    },
  });
  revalidatePath("/dashboard/admin/settings");
}

export default async function AdminSettingsPage() {
  const sessionUser = await ensureAdmin();
  const navItems = navByRole.ADMIN;
  const settings = await getSystemSettings();

  const [sessionCount, pendingJobs, pendingAccomplishments] = await prisma.$transaction([
    prisma.session.count(),
    prisma.job.count({ where: { isApproved: false, isActive: true } }),
    prisma.accomplishment.count({ where: { isApproved: false } }),
  ]);

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">System Settings</p>
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
            <Badge className="rounded-full border-0 bg-indigo-600 text-white">Enterprise Controls</Badge>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              <SlidersHorizontal className="size-7 text-indigo-600" />
              Admin System Settings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Configure registration, moderation rules, and platform-level safeguards.
            </p>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SnapshotCard label="Active Sessions" value={sessionCount.toLocaleString("en-US")} />
            <SnapshotCard label="Pending Jobs" value={pendingJobs.toLocaleString("en-US")} />
            <SnapshotCard
              label="Pending Achievements"
              value={pendingAccomplishments.toLocaleString("en-US")}
            />
          </div>

          <form action={updateSystemSettingsAction} className="mt-4 space-y-4">
            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <UserCog className="size-5 text-indigo-600" />
                  Access & Registration
                </CardTitle>
                <CardDescription>Control account onboarding behavior</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <SettingsToggle
                  name="allowPublicRegistration"
                  label="Public Registration"
                  description="Allow new alumni users to sign up from the register page."
                  checked={settings.allowPublicRegistration}
                />
                <SettingsToggle
                  name="defaultNewUserVerified"
                  label="Auto Verify New Members"
                  description="Newly registered users start as verified accounts."
                  checked={settings.defaultNewUserVerified}
                />
                <SettingsToggle
                  name="maintenanceMode"
                  label="Maintenance Mode"
                  description="Blocks registration and member submissions temporarily."
                  checked={settings.maintenanceMode}
                  danger
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <ShieldCheck className="size-5 text-indigo-600" />
                  Moderation Workflow
                </CardTitle>
                <CardDescription>Define approval behavior for jobs and achievements</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <SettingsToggle
                  name="requireApprovalForJobs"
                  label="Jobs Need Approval"
                  description="All non-admin job posts go to moderation queue."
                  checked={settings.requireApprovalForJobs}
                />
                <SettingsToggle
                  name="requireApprovalForAccomplishments"
                  label="Achievements Need Approval"
                  description="All non-admin achievements go to moderation queue."
                  checked={settings.requireApprovalForAccomplishments}
                />
                <SettingsToggle
                  name="adminAutoApproveOwnContent"
                  label="Admin Auto Approval"
                  description="Admin submissions publish instantly without moderation."
                  checked={settings.adminAutoApproveOwnContent}
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                Save System Settings
              </Button>
              <Button
                type="submit"
                formAction={resetSystemSettingsAction}
                variant="outline"
                className="rounded-xl border-slate-200 bg-white"
              >
                Reset to Defaults
              </Button>
            </div>
          </form>

          <Card className="mt-4 border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Security Operations</CardTitle>
              <CardDescription>Immediate operational actions for admin safety control</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <form action={revokeOtherSessionsAction}>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                  Revoke All Other Sessions
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function SettingsToggle({
  name,
  label,
  description,
  checked,
  danger = false,
}: {
  name: keyof SystemSettings;
  label: string;
  description: string;
  checked: boolean;
  danger?: boolean;
}) {
  return (
    <label
      className={`rounded-2xl border p-4 transition ${
        danger
          ? "border-rose-200 bg-rose-50/60 hover:border-rose-300"
          : "border-slate-200 bg-white/80 hover:border-indigo-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>
      <p className="mt-2 text-xs text-slate-600">{description}</p>
    </label>
  );
}

function SnapshotCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="overflow-hidden border-0 bg-white/90 shadow-[0_22px_48px_-26px_rgba(37,99,235,0.55)]">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
      <CardHeader className="pb-2">
        <CardDescription className="text-slate-500">{label}</CardDescription>
        <CardTitle className="text-3xl text-slate-900">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

