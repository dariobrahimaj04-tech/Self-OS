import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function getSessionFromHeaders(requestHeaders: Headers) {
  try {
    return await auth.api.getSession({
      headers: requestHeaders
    });
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  return getSessionFromHeaders(await headers());
}

export async function requireUser() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user as AuthUser;
}

export async function requireApiUser(requestHeaders: Headers) {
  const session = await getSessionFromHeaders(requestHeaders);
  return session?.user?.id ? (session.user as AuthUser) : null;
}
