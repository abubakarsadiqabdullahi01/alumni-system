import { Sparkles } from "lucide-react";
import { ShareAchievementForm } from "@/components/accomplishments/share-achievement-form";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { navByRole, roleTitle } from "@/components/dashboard/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export default async function ShareAchievementPage() {
  const sessionUser = await requireSessionUser();
  const navItems = navByRole[sessionUser.role];

  const alumni = await prisma.alumni.findUnique({
    where: { userId: sessionUser.userId },
    select: { id: true },
  });

  return (
    <main className="bg-premium-mesh min-h-screen">
      <div className="mx-auto flex max-w-[1440px] items-start gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5">
        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Share Achievement</p>
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
              <Sparkles className="size-7 text-indigo-600" />
              Share Achievement
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Submit milestones to celebrate your alumni impact.
            </p>
          </header>

          {alumni ? (
            <div className="mt-4">
              <ShareAchievementForm canSubmit />
            </div>
          ) : (
            <Card className="mt-4 border-0 bg-white/85 shadow-lg shadow-indigo-100/50">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Profile Required</CardTitle>
                <CardDescription>
                  You need an Alumni profile to submit accomplishments.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                This account currently has no linked alumni profile, so achievement submission is disabled.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
