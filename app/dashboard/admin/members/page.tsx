import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

type AdminMembersPageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: "ADMIN" | "MODERATOR" | "MEMBER" | "ALL";
    status?: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "ALL";
    verified?: "true" | "false" | "all";
    sort?: "createdAt" | "name" | "email" | "role";
    order?: "asc" | "desc";
    page?: string;
  }>;
};

async function ensureAdmin() {
  const sessionUser = await requireSessionUser();
  if (sessionUser.role !== "ADMIN") {
    if (sessionUser.role === "MODERATOR") redirect("/dashboard/moderator");
    redirect("/dashboard/member");
  }
  return sessionUser;
}

async function updateMemberAdminAction(formData: FormData) {
  "use server";
  const sessionUser = await ensureAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  const verified = String(formData.get("verified") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!userId) return;
  if (role !== "ADMIN" && role !== "MODERATOR" && role !== "MEMBER") return;
  if (verified !== "true" && verified !== "false") return;

  if (userId === sessionUser.userId && role !== "ADMIN") {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      isVerified: verified === "true",
    },
  });

  if (status === "ACTIVE" || status === "SUSPENDED" || status === "INACTIVE") {
    const alumni = await prisma.alumni.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (alumni) {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: { status },
      });
    }
  }

  revalidatePath("/dashboard/admin/members");
  revalidatePath("/dashboard/admin");
}

async function createAlumniProfileAction(formData: FormData) {
  "use server";
  await ensureAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const existing = await prisma.alumni.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const matricNo = `USR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await prisma.alumni.create({
    data: {
      userId,
      matricNo,
      department: "General Studies",
      graduationYear: new Date().getFullYear(),
      status: "ACTIVE",
    },
  });

  revalidatePath("/dashboard/admin/members");
}

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const sessionUser = await ensureAdmin();
  const navItems = navByRole.ADMIN;
  const resolved = await searchParams;

  const q = resolved?.q?.trim() ?? "";
  const role = resolved?.role ?? "ALL";
  const status = resolved?.status ?? "ALL";
  const verified = resolved?.verified ?? "all";
  const sort = resolved?.sort ?? "createdAt";
  const order: "asc" | "desc" = resolved?.order === "asc" ? "asc" : "desc";
  const page = Math.max(Number(resolved?.page ?? "1") || 1, 1);
  const pageSize = 12;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { alumni: { is: { matricNo: { contains: q, mode: "insensitive" as const } } } },
            { alumni: { is: { department: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
    ...(role !== "ALL" ? { role } : {}),
    ...(verified === "true" ? { isVerified: true } : {}),
    ...(verified === "false" ? { isVerified: false } : {}),
    ...(status !== "ALL"
      ? {
          alumni: {
            is: {
              status,
            },
          },
        }
      : {}),
  };

  const [totalUsers, verifiedUsers, moderators, suspendedMembers, membersCount, members] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { OR: [{ role: "ADMIN" }, { role: "MODERATOR" }] } }),
      prisma.alumni.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          alumni: {
            select: {
              id: true,
              matricNo: true,
              department: true,
              graduationYear: true,
              status: true,
            },
          },
        },
        orderBy:
          sort === "name"
            ? { name: order }
            : sort === "email"
              ? { email: order }
              : sort === "role"
                ? { role: order }
                : { createdAt: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

  const totalPages = Math.max(Math.ceil(membersCount / pageSize), 1);
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  baseParams.set("role", role);
  baseParams.set("status", status);
  baseParams.set("verified", verified);
  baseParams.set("sort", sort);
  baseParams.set("order", order);

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Member Management</p>
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
            <Badge className="rounded-full border-0 bg-indigo-600 text-white">Admin Control</Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Member Management Center
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Full control over roles, verification, and alumni account status.
            </p>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <StatCard label="Total Users" value={totalUsers} icon={Users} />
            <StatCard label="Verified Users" value={verifiedUsers} icon={UserCheck} />
            <StatCard label="Admin/Moderators" value={moderators} icon={ShieldCheck} />
            <StatCard label="Suspended Members" value={suspendedMembers} icon={ShieldCheck} />
          </div>

          <Card className="mt-4 overflow-hidden border-0 bg-white/90 shadow-[0_28px_60px_-28px_rgba(37,99,235,0.45)]">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400" />
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Filters & Sorting</CardTitle>
              <CardDescription>Search and refine member records</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                <Input name="q" defaultValue={q} placeholder="Name, email, phone, matric..." className="h-10 rounded-xl border-white/80 bg-white/80 lg:col-span-2" />
                <select name="role" defaultValue={role} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="MEMBER">MEMBER</option>
                </select>
                <select name="status" defaultValue={status} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <select name="verified" defaultValue={verified} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">
                  <option value="all">All Verify</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
                <select name="sort" defaultValue={sort} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">
                  <option value="createdAt">Newest</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                </select>
                <div className="flex items-center gap-2">
                  <select name="order" defaultValue={order} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                  <Button type="submit" className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                    <Search className="size-4" />
                    Filter
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4 overflow-hidden border-0 bg-white/90 shadow-[0_28px_60px_-28px_rgba(37,99,235,0.45)]">
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Members Directory</CardTitle>
              <CardDescription>Page {page} of {totalPages} | Found {membersCount} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="sticky left-0 z-10 bg-slate-50/95 px-3 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Role</th>
                    <th className="px-3 py-3 font-semibold">Verified</th>
                    <th className="px-3 py-3 font-semibold">Alumni Status</th>
                    <th className="px-3 py-3 font-semibold">Department</th>
                    <th className="px-3 py-3 font-semibold">Joined</th>
                    <th className="px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-4 text-center text-slate-500">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    members.map((member: {
                      id: string;
                      name: string | null;
                      email: string | null;
                      phone: string | null;
                      role: "ADMIN" | "MODERATOR" | "MEMBER";
                      isVerified: boolean;
                      createdAt: Date;
                      alumni: {
                        id: string;
                        matricNo: string;
                        department: string;
                        graduationYear: number;
                        status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
                      } | null;
                    }, index: number) => (
                      <tr key={member.id} className={`border-b border-slate-100 align-middle transition hover:bg-indigo-50/40 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/35"}`}>
                        <td className="sticky left-0 z-10 bg-inherit px-3 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                              {member.name?.slice(0, 2).toUpperCase() ?? "US"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{member.name ?? "Unnamed"}</p>
                              <p className="truncate text-xs text-slate-500">{member.phone ?? "No phone"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{member.email ?? "-"}</td>
                        <td className="px-3 py-3 text-slate-700">{member.role}</td>
                        <td className="px-3 py-3">
                            <Badge className={member.isVerified ? "rounded-full border-0 bg-emerald-600 text-white shadow" : "rounded-full border-0 bg-slate-500 text-white shadow"}>
                              {member.isVerified ? "VERIFIED" : "UNVERIFIED"}
                            </Badge>
                          </td>
                        <td className="px-3 py-3">
                          <Badge className={member.alumni?.status === "ACTIVE" ? "rounded-full border-0 bg-emerald-600 text-white shadow" : member.alumni?.status === "SUSPENDED" ? "rounded-full border-0 bg-amber-500 text-white shadow" : member.alumni?.status === "INACTIVE" ? "rounded-full border-0 bg-slate-500 text-white shadow" : "rounded-full border-0 bg-rose-600 text-white shadow"}>
                            {member.alumni?.status ?? "NO PROFILE"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {member.alumni ? `${member.alumni.department} (${member.alumni.graduationYear})` : "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(member.createdAt)}</td>
                        <td className="px-3 py-3">
                          {member.alumni ? (
                            <>
                              <form id={`update-member-${member.id}`} action={updateMemberAdminAction} className="grid grid-cols-3 gap-2">
                                <input type="hidden" name="userId" value={member.id} />
                                <select name="role" defaultValue={member.role} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="MODERATOR">MODERATOR</option>
                                  <option value="MEMBER">MEMBER</option>
                                </select>
                                <select name="verified" defaultValue={member.isVerified ? "true" : "false"} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
                                  <option value="true">VERIFIED</option>
                                  <option value="false">UNVERIFIED</option>
                                </select>
                                <select name="status" defaultValue={member.alumni.status} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="SUSPENDED">SUSPENDED</option>
                                  <option value="INACTIVE">INACTIVE</option>
                                </select>
                              </form>
                              <ConfirmActionButton
                                formId={`update-member-${member.id}`}
                                triggerLabel="Save"
                                confirmLabel="Apply Changes"
                                title="Apply member updates?"
                                description={`You are updating role/status for ${member.name ?? "this user"}.`}
                                triggerVariant="outline"
                                triggerClassName="mt-2 w-full rounded-lg border-slate-200 bg-white"
                              />
                            </>
                          ) : (
                            <>
                              <form id={`create-alumni-${member.id}`} action={createAlumniProfileAction}>
                                <input type="hidden" name="userId" value={member.id} />
                              </form>
                              <ConfirmActionButton
                                formId={`create-alumni-${member.id}`}
                                triggerLabel="Create Profile"
                                confirmLabel="Create Alumni Profile"
                                title="Create alumni profile?"
                                description="This will generate a basic alumni profile for this user."
                                triggerVariant="outline"
                                triggerClassName="w-full rounded-lg border-slate-200 bg-white"
                              />
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white" disabled={page <= 1}>
                    <Link
                      href={`/dashboard/admin/members?${new URLSearchParams({
                        ...Object.fromEntries(baseParams),
                        page: String(Math.max(page - 1, 1)),
                      }).toString()}`}
                    >
                      Previous
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white" disabled={page >= totalPages}>
                    <Link
                      href={`/dashboard/admin/members?${new URLSearchParams({
                        ...Object.fromEntries(baseParams),
                        page: String(Math.min(page + 1, totalPages)),
                      }).toString()}`}
                    >
                      Next
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: ComponentType<{ className?: string }> }) {
  return (
    <Card className="overflow-hidden border-0 bg-white/90 shadow-[0_22px_48px_-26px_rgba(37,99,235,0.55)]">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
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
