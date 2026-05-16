"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, LogIn, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = rawCallbackUrl?.startsWith("/") && !rawCallbackUrl.startsWith("//") ? rawCallbackUrl : "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");

    setPending(true);
    try {
      const response = isSignup
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password });

      if (response.error) {
        setError(response.error.message || "Authentication failed.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-line bg-panel/95 p-5 shadow-soft sm:p-6">
        <Link href="/login" className="mb-7 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-mineral text-[#041018]">
            <Activity size={21} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-normal text-ink">SelfOS</span>
            <span className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Private personal operating system
            </span>
          </span>
        </Link>

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mineral">
            {isSignup ? "Create account" : "Welcome back"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
            {isSignup ? "Start your private SelfOS." : "Log in to SelfOS."}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {isSignup
              ? "Your meals, workouts, journal, habits, money, and learning data stay scoped to your account."
              : "Continue tracking with your private dashboard and personal records."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {isSignup ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Name</span>
              <input
                className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted"
                name="name"
                autoComplete="name"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Email</span>
            <input
              className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Password</span>
            <input
              className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted"
              name="password"
              type="password"
              minLength={8}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-ember/30 bg-ember/10 p-3 text-sm text-ink">{error}</div>
          ) : null}

          <button
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-400/40 transition-colors hover:bg-blue-500 disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {isSignup ? <UserPlus size={17} /> : <LogIn size={17} />}
            {pending ? "Working..." : isSignup ? "Create Account" : "Log In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {isSignup ? "Already have an account?" : "New to SelfOS?"}{" "}
          <Link className="font-semibold text-mineral hover:text-mineral/80" href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Log in" : "Create one"}
          </Link>
        </p>
      </section>
    </main>
  );
}
