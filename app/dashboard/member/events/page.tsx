import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CalendarDays, Clock3, MapPin, Sparkles, Users } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { cancelEventRsvp, getMemberEventsData, rsvpToEvent } from "@/lib/events/service";

type MemberEventsPageProps = {
  searchParams?: Promise<{
    q?: string;
    city?: string;
  }>;
};

async function ensureMemberSession() {
  const sessionUser = await requireSessionUser();
  if (sessionUser.role !== "MEMBER") {
    if (sessionUser.role === "ADMIN") redirect("/dashboard/admin");
    redirect("/dashboard/moderator");
  }
  return sessionUser;
}

async function rsvpEventAction(formData: FormData) {
  "use server";
  const sessionUser = await ensureMemberSession();
  const alumni = await prisma.alumni.findUnique({
    where: { userId: sessionUser.userId },
    select: { id: true },
  });
  if (!alumni) return;
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await rsvpToEvent(alumni.id, eventId);
  revalidatePath("/dashboard/member/events");
}

async function cancelRsvpAction(formData: FormData) {
  "use server";
  const sessionUser = await ensureMemberSession();
  const alumni = await prisma.alumni.findUnique({
    where: { userId: sessionUser.userId },
    select: { id: true },
  });
  if (!alumni) return;
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await cancelEventRsvp(alumni.id, eventId);
  revalidatePath("/dashboard/member/events");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function MemberEventsPage({ searchParams }: MemberEventsPageProps) {
  const sessionUser = await ensureMemberSession();
  const navItems = navByRole.MEMBER;
  const resolved = await searchParams;
  const q = resolved?.q?.trim() ?? "";
  const city = resolved?.city?.trim() ?? "";

  const alumni = await prisma.alumni.findUnique({
    where: { userId: sessionUser.userId },
    select: { id: true, user: { select: { name: true, email: true } } },
  });

  if (!alumni) {
    return (
      <main className="bg-premium-mesh min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Card className="border-0 bg-white/90 shadow-xl shadow-indigo-100/60">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Alumni Profile Required</CardTitle>
              <CardDescription>
                Your account needs an alumni profile before you can join events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                <Link href="/profile">Open Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const data = await getMemberEventsData(alumni.id, { q, city });

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Member Events</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{alumni.user.name ?? "Member User"}</p>
            <p className="text-sm text-slate-600">{alumni.user.email ?? ""}</p>
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
              Professional Events
            </Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Member Events Center
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Discover alumni events, RSVP instantly, and track your participation.
            </p>
          </header>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <StatCard label="Upcoming Events" value={data.stats.upcomingEvents} icon={CalendarDays} />
            <StatCard label="My RSVPs" value={data.stats.myRsvps} icon={Users} />
            <StatCard label="This Month" value={data.stats.thisMonthEvents} icon={Clock3} />
          </div>

          <Card className="mt-4 border-0 bg-white/90 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.5)]">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Find Events</CardTitle>
              <CardDescription>Search by title, description, location, or city</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-[1fr_220px_140px]">
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search events, locations, or keywords..."
                  className="h-11 rounded-xl border-white/80 bg-white/80"
                />
                <select
                  name="city"
                  defaultValue={city}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="">All Cities</option>
                  {data.cities.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
                <Button type="submit" className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                  Apply Filters
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {data.events.length === 0 ? (
              <Card className="xl:col-span-2 border-0 bg-white/85 shadow-lg shadow-indigo-100/40">
                <CardContent className="py-8 text-center text-sm text-slate-600">
                  No events found for your current filters.
                </CardContent>
              </Card>
            ) : (
              data.events.map((event) => {
                const isFull = event.capacity !== null && event.rsvpCount >= event.capacity;
                return (
                  <Card
                    key={event.id}
                    className="border-0 bg-white/90 shadow-[0_18px_42px_-24px_rgba(37,99,235,0.5)]"
                  >
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-lg text-slate-900">{event.title}</CardTitle>
                        <Badge
                          className={
                            event.isGoing
                              ? "rounded-full border-0 bg-emerald-600 text-white"
                              : "rounded-full border-0 bg-indigo-600 text-white"
                          }
                        >
                          {event.isGoing ? "RSVP: Going" : "Open"}
                        </Badge>
                      </div>
                      <CardDescription>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="size-3.5" />
                          {formatDateTime(event.startAt)}
                        </span>
                        <span className="mx-2">|</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {[event.location, event.city].filter(Boolean).join(", ") || "TBA"}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-slate-700">
                        {event.description ?? "No event description provided."}
                      </p>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-700">
                        <p>
                          <span className="font-semibold text-slate-900">Attendance:</span>{" "}
                          {event.rsvpCount.toLocaleString("en-US")}
                          {event.capacity !== null ? ` / ${event.capacity.toLocaleString("en-US")}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.isGoing ? (
                          <form action={cancelRsvpAction}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              className="rounded-xl border-slate-200 bg-white"
                            >
                              Cancel RSVP
                            </Button>
                          </form>
                        ) : (
                          <form action={rsvpEventAction}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <Button
                              type="submit"
                              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                              disabled={isFull}
                            >
                              {isFull ? "Event Full" : "RSVP Now"}
                            </Button>
                          </form>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
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

