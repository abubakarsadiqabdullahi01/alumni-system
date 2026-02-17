import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { requireSessionUser } from "@/lib/auth/server";

export default async function ModeratorDashboardPage() {
  const sessionUser = await requireSessionUser();

  if (sessionUser.role === "MEMBER") {
    redirect("/dashboard/member");
  }

  if (sessionUser.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  return <DashboardApp role="MODERATOR" displayName={sessionUser.name} />;
}
