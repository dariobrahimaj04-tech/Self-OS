import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getPrisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL, process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter(
    Boolean
  ) as string[],
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  plugins: [nextCookies()]
});
