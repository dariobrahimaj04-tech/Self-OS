import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getCurrentSession } from "@/lib/auth-server";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "SelfOS",
  description: "A personal growth operating system for health, productivity, learning, and money."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <AppShell user={session?.user ?? null}>{children}</AppShell>
      </body>
    </html>
  );
}
