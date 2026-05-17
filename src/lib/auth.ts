import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getPrisma } from "@/lib/prisma";

const productionOrigin = "https://selfos-tau.vercel.app";
const localOrigin = "http://localhost:3000";

function toOrigin(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, "");
  }
}

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? localOrigin;
const trustedOrigins = Array.from(
  new Set(
    [localOrigin, productionOrigin, process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL]
      .map(toOrigin)
      .filter((origin): origin is string => Boolean(origin))
  )
);

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  plugins: [nextCookies()]
});
