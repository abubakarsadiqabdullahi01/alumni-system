import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/server";

export default async function DashboardPage() {
  const sessionUser = await requireSessionUser();

  if (sessionUser.role === "MEMBER") {
    redirect("/dashboard/member");
  }

  if (sessionUser.role === "MODERATOR") {
    redirect("/dashboard/moderator");
  }

  redirect("/dashboard/admin");
}
