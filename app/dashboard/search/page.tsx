import Link from "next/link";
import { Download, Search } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole, roleTitle } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

type SearchPageProps = {
  searchParams?: Promise<{
    dept?: string;
    year?: string;
    city?: string;
    employer?: string;
    skills?: string;
    view?: "table" | "grid";
    page?: string;
    sort?: string;
    order?: "asc" | "desc";
  }>;
};

export default async function SearchDashboardPage({ searchParams }: SearchPageProps) {
  const sessionUser = await requireSessionUser();
  const resolved = await searchParams;

  const dept = resolved?.dept?.trim() ?? "";
  const year = resolved?.year?.trim() ?? "";
  const city = resolved?.city?.trim() ?? "";
  const employer = resolved?.employer?.trim() ?? "";
  const skills = resolved?.skills?.trim() ?? "";
  const view = resolved?.view === "table" ? "table" : "grid";
  const page = Math.max(Number(resolved?.page ?? "1") || 1, 1);
  const sort = resolved?.sort ?? "createdAt";
  const order: "asc" | "desc" = resolved?.order === "asc" ? "asc" : "desc";
  const pageSize = 12;

  const parsedYear = Number(year);
  const yearFilter = Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null;

  const filters = [];
  if (dept) filters.push({ department: { contains: dept, mode: "insensitive" as const } });
  if (yearFilter) filters.push({ graduationYear: yearFilter });
  if (city) filters.push({ currentCity: { contains: city, mode: "insensitive" as const } });
  if (employer) filters.push({ employer: { contains: employer, mode: "insensitive" as const } });
  if (skills) filters.push({ skills: { contains: skills, mode: "insensitive" as const } });

  const where = filters.length > 0 ? { AND: filters } : undefined;

  const [count, results] = await prisma.$transaction([
    prisma.alumni.count({ where }),
    prisma.alumni.findMany({
      where,
      select: {
        id: true,
        matricNo: true,
        department: true,
        graduationYear: true,
        status: true,
        employer: true,
        currentCity: true,
        jobTitle: true,
        skills: true,
        user: {
          select: {
            name: true,
            image: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy:
        sort === "name"
          ? { user: { name: order } }
          : sort === "title"
            ? { jobTitle: order }
            : sort === "company"
              ? { employer: order }
              : sort === "graduationYear"
                ? { graduationYear: order }
                : sort === "department"
                  ? { department: order }
                  : { createdAt: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.max(Math.ceil(count / pageSize), 1);

  const query = new URLSearchParams();
  if (dept) query.set("dept", dept);
  if (year) query.set("year", year);
  if (city) query.set("city", city);
  if (employer) query.set("employer", employer);
  if (skills) query.set("skills", skills);
  query.set("sort", sort);
  query.set("order", order);
  query.set("view", view);
  const exportHref = `/api/alumni/export${query.toString() ? `?${query.toString()}` : ""}`;
  const baseParams = new URLSearchParams(query);

  const navItems = navByRole[sessionUser.role];

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Alumni Search</p>
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
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Advanced Alumni Search</h1>
            <p className="mt-1 text-sm text-slate-600">Found {count.toLocaleString("en-US")} results</p>
          </header>

          <Card className="mt-4 border-0 bg-white/85 shadow-lg shadow-indigo-100/50">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-900">Filters</CardTitle>
                  <CardDescription>Department, year, city, employer, and skill-based filtering</CardDescription>
                </div>
                {sessionUser.role === "ADMIN" ? (
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                    <Link href={exportHref}>
                      <Download className="size-4" />
                      Export CSV
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input name="dept" defaultValue={dept} placeholder="Department" className="h-10 rounded-xl border-white/80 bg-white/80" />
                <Input name="year" defaultValue={year} placeholder="Year" className="h-10 rounded-xl border-white/80 bg-white/80" />
                <Input name="city" defaultValue={city} placeholder="City" className="h-10 rounded-xl border-white/80 bg-white/80" />
                <Input name="employer" defaultValue={employer} placeholder="Employer" className="h-10 rounded-xl border-white/80 bg-white/80" />
                <Input name="skills" defaultValue={skills} placeholder="Skills" className="h-10 rounded-xl border-white/80 bg-white/80" />
                <select name="sort" defaultValue={sort} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">
                  <option value="createdAt">Newest</option>
                  <option value="name">Name</option>
                  <option value="title">Title</option>
                  <option value="company">Company</option>
                  <option value="graduationYear">Graduation Year</option>
                  <option value="department">Department</option>
                </select>
                <select name="order" defaultValue={order} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
                <input type="hidden" name="view" value={view} />
                <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                  <Button type="submit" className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                    <Search className="size-4" />
                    Search
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center gap-2">
            <Button asChild variant={view === "grid" ? "default" : "outline"} className={view === "grid" ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
              <Link href={`/dashboard/search?${new URLSearchParams({ dept, year, city, employer, skills, sort, order, page: "1", view: "grid" }).toString()}`}>Grid</Link>
            </Button>
            <Button asChild variant={view === "table" ? "default" : "outline"} className={view === "table" ? "rounded-xl bg-indigo-600 text-white hover:bg-indigo-500" : "rounded-xl border-slate-200 bg-white"}>
              <Link href={`/dashboard/search?${new URLSearchParams({ dept, year, city, employer, skills, sort, order, page: "1", view: "table" }).toString()}`}>Table</Link>
            </Button>
          </div>

          {view === "grid" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((item) => (
                <Card
                  key={item.id}
                  className="relative overflow-hidden rounded-2xl border border-indigo-100/70 bg-gradient-to-br from-white to-indigo-50/70 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-28px_rgba(37,99,235,0.7)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400" />
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <Badge
                          className={
                            item.status === "ACTIVE"
                              ? "rounded-full border-0 bg-emerald-600 text-white"
                              : item.status === "SUSPENDED"
                                ? "rounded-full border-0 bg-amber-500 text-white"
                                : "rounded-full border-0 bg-slate-500 text-white"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      {item.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.user.image}
                          alt={item.user.name ?? "Alumni photo"}
                          className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-md"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 shadow-md">
                          {item.user.name?.slice(0, 1).toUpperCase() ?? "A"}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg text-slate-900">{item.user.name ?? "Unnamed Alumni"}</CardTitle>
                    <CardDescription className="font-medium text-indigo-700">{item.jobTitle ?? "No title yet"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-700">
                    <div className="grid gap-2 rounded-xl border border-white/80 bg-white/70 p-3">
                      <p><span className="font-semibold">Email:</span> {item.user.email ?? "Not set"}</p>
                      <p><span className="font-semibold">Phone:</span> {item.user.phone ?? "Not set"}</p>
                      <p><span className="font-semibold">Matric No:</span> {item.matricNo}</p>
                      <p><span className="font-semibold">Company:</span> {item.employer ?? "Not set"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="rounded-full bg-indigo-100 text-indigo-700">
                        {item.department} {item.graduationYear}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full bg-sky-100 text-sky-700">
                        {item.currentCity ?? "City not set"}
                      </Badge>
                    </div>
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-2.5 text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold text-slate-700">Skills:</span> {item.skills ?? "Not set"}
                    </p>
                    <div className="pt-1">
                      <Button asChild size="sm" className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
                        <Link href={`mailto:${item.user.email ?? ""}`}>Contact</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-4 border-0 bg-white/85 shadow-lg shadow-indigo-100/40">
              <CardContent className="overflow-x-auto pt-6">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-2 py-2 font-medium">Photo</th>
                      <th className="px-2 py-2 font-medium">Name</th>
                      <th className="px-2 py-2 font-medium">Email</th>
                      <th className="px-2 py-2 font-medium">Matric No</th>
                      <th className="px-2 py-2 font-medium">Title</th>
                      <th className="px-2 py-2 font-medium">Company</th>
                      <th className="px-2 py-2 font-medium">Department</th>
                      <th className="px-2 py-2 font-medium">City</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-2 py-3">
                          {item.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.user.image}
                              alt={item.user.name ?? "Alumni photo"}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                              {item.user.name?.slice(0, 1).toUpperCase() ?? "A"}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 font-medium text-slate-900">{item.user.name ?? "Unnamed Alumni"}</td>
                        <td className="px-2 py-3 text-slate-700">{item.user.email ?? "Not set"}</td>
                        <td className="px-2 py-3 text-slate-700">{item.matricNo}</td>
                        <td className="px-2 py-3 text-slate-700">{item.jobTitle ?? "Not set"}</td>
                        <td className="px-2 py-3 text-slate-700">{item.employer ?? "Not set"}</td>
                        <td className="px-2 py-3 text-slate-700">{item.department} ({item.graduationYear})</td>
                        <td className="px-2 py-3 text-slate-700">{item.currentCity ?? "Not set"}</td>
                        <td className="px-2 py-3 text-slate-700">{item.status}</td>
                        <td className="px-2 py-3">
                          <Button asChild size="sm" variant="outline" className="rounded-lg border-slate-200 bg-white">
                            <Link href={`mailto:${item.user.email ?? ""}`}>Contact</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white" disabled={page <= 1}>
                <Link
                  href={`/dashboard/search?${new URLSearchParams({
                    ...Object.fromEntries(baseParams),
                    page: String(Math.max(page - 1, 1)),
                  }).toString()}`}
                >
                  Previous
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white" disabled={page >= totalPages}>
                <Link
                  href={`/dashboard/search?${new URLSearchParams({
                    ...Object.fromEntries(baseParams),
                    page: String(Math.min(page + 1, totalPages)),
                  }).toString()}`}
                >
                  Next
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
