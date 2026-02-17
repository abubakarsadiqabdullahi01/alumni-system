import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole, roleTitle } from "@/components/dashboard/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  searchParams?: Promise<{
    updated?: string;
    error?: string;
  }>;
};

async function updateProfileAction(formData: FormData) {
  "use server";
  const sessionUser = await requireSessionUser();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const graduationYearRaw = String(formData.get("graduationYear") ?? "").trim();
  const currentCity = String(formData.get("currentCity") ?? "").trim();
  const employer = String(formData.get("employer") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const skills = String(formData.get("skills") ?? "").trim();

  const graduationYear = Number(graduationYearRaw);
  const hasGraduationYear = Number.isInteger(graduationYear) && graduationYear >= 1980 && graduationYear <= 2100;

  await prisma.user.update({
    where: { id: sessionUser.userId },
    data: {
      name: name.length > 0 ? name : null,
      phone: phone.length > 0 ? phone : null,
    },
  });

  const existingAlumni = await prisma.alumni.findUnique({
    where: { userId: sessionUser.userId },
    select: { id: true, matricNo: true },
  });

  const shouldUpsertAlumni =
    department.length > 0 ||
    hasGraduationYear ||
    currentCity.length > 0 ||
    employer.length > 0 ||
    jobTitle.length > 0 ||
    skills.length > 0;

  if (shouldUpsertAlumni) {
    if (existingAlumni) {
      await prisma.alumni.update({
        where: { id: existingAlumni.id },
        data: {
          department: department.length > 0 ? department : undefined,
          graduationYear: hasGraduationYear ? graduationYear : undefined,
          currentCity: currentCity.length > 0 ? currentCity : null,
          employer: employer.length > 0 ? employer : null,
          jobTitle: jobTitle.length > 0 ? jobTitle : null,
          skills: skills.length > 0 ? skills : null,
        },
      });
    } else {
      const generatedMatricNo = `USR-${sessionUser.userId.slice(-12).toUpperCase()}`;
      await prisma.alumni.create({
        data: {
          userId: sessionUser.userId,
          matricNo: generatedMatricNo,
          department: department.length > 0 ? department : "General Studies",
          graduationYear: hasGraduationYear ? graduationYear : new Date().getFullYear(),
          currentCity: currentCity.length > 0 ? currentCity : null,
          employer: employer.length > 0 ? employer : null,
          jobTitle: jobTitle.length > 0 ? jobTitle : null,
          skills: skills.length > 0 ? skills : null,
        },
      });
    }
  }

  revalidatePath("/profile");
  redirect("/profile?updated=profile");
}

async function changePasswordAction(formData: FormData) {
  "use server";
  const sessionUser = await requireSessionUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect("/profile?error=pwd_length");
  }

  if (newPassword !== confirmPassword) {
    redirect("/profile?error=pwd_mismatch");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    redirect("/profile?error=no_pwd");
  }

  const validCurrentPassword = await verifyPassword(currentPassword, user.passwordHash);
  if (!validCurrentPassword) {
    redirect("/profile?error=pwd_current");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: sessionUser.userId },
    data: { passwordHash },
  });

  revalidatePath("/profile");
  redirect("/profile?updated=password");
}

function getErrorMessage(error: string | undefined) {
  if (error === "pwd_length") return "New password must be at least 8 characters.";
  if (error === "pwd_mismatch") return "New password and confirmation do not match.";
  if (error === "no_pwd") return "This account has no password set.";
  if (error === "pwd_current") return "Current password is incorrect.";
  return null;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const sessionUser = await requireSessionUser();
  const navItems = navByRole[sessionUser.role];
  const resolvedSearchParams = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
      alumni: {
        select: {
          matricNo: true,
          department: true,
          graduationYear: true,
          currentCity: true,
          employer: true,
          jobTitle: true,
          skills: true,
        },
      },
    },
  });

  const successMessage =
    resolvedSearchParams?.updated === "profile"
      ? "Profile updated successfully."
      : resolvedSearchParams?.updated === "password"
        ? "Password changed successfully."
        : null;

  const errorMessage = getErrorMessage(resolvedSearchParams?.error);

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Signed in as</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user?.name ?? "Alumni User"}</p>
            <p className="text-sm text-slate-600">{user?.email ?? ""}</p>
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
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Welcome, {user?.name ?? "Alumni User"}.
            </h1>
            <p className="mt-1 text-sm text-slate-600">Manage your profile details and password settings.</p>
          </header>

          {successMessage ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card className="border-0 bg-white/85 shadow-xl shadow-indigo-100/50">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Edit Profile</CardTitle>
                <CardDescription>Update contact, career, and alumni details</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateProfileAction} className="grid gap-3 sm:grid-cols-2">
                  <Input name="name" defaultValue={user?.name ?? ""} placeholder="Full Name" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input name="phone" defaultValue={user?.phone ?? ""} placeholder="Phone" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input name="department" defaultValue={user?.alumni?.department ?? ""} placeholder="Department" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input
                    name="graduationYear"
                    type="number"
                    defaultValue={user?.alumni?.graduationYear?.toString() ?? ""}
                    placeholder="Graduation Year"
                    className="h-11 rounded-xl border-white/80 bg-white/80"
                  />
                  <Input name="currentCity" defaultValue={user?.alumni?.currentCity ?? ""} placeholder="Current City" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input name="employer" defaultValue={user?.alumni?.employer ?? ""} placeholder="Employer" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input name="jobTitle" defaultValue={user?.alumni?.jobTitle ?? ""} placeholder="Job Title" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input name="skills" defaultValue={user?.alumni?.skills ?? ""} placeholder="Skills (comma separated)" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <div className="sm:col-span-2">
                    <Button type="submit" className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                      Save Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/85 shadow-xl shadow-indigo-100/50">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Change Password</CardTitle>
                <CardDescription>Secure your account with a new password</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={changePasswordAction} className="space-y-3">
                  <Input name="currentPassword" type="password" placeholder="Current Password" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input name="newPassword" type="password" placeholder="New Password (min 8 chars)" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Input name="confirmPassword" type="password" placeholder="Confirm New Password" className="h-11 rounded-xl border-white/80 bg-white/80" />
                  <Button type="submit" className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
              <Link
                href={
                  sessionUser.role === "ADMIN"
                    ? "/dashboard/admin"
                    : sessionUser.role === "MODERATOR"
                      ? "/dashboard/moderator"
                      : "/dashboard/member"
                }
              >
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
