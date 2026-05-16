import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentSession } from "@/lib/auth-server";

export default async function SignupPage() {
  const session = await getCurrentSession();

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <Suspense fallback={null}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
