import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      mode="login"
      title="Welcome Back"
      subtitle="Sign in to access your GSU Gombe Alumni dashboard, jobs, and achievement feed."
    >
      <LoginForm />
    </AuthShell>
  );
}
