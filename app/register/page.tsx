import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      mode="register"
      title="Join GSU Gombe Alumni"
      subtitle="Create your verified account to connect with classmates and alumni opportunities."
    >
      <RegisterForm />
    </AuthShell>
  );
}
