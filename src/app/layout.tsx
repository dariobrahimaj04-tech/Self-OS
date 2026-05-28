import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaInstaller } from "@/components/pwa-installer";
import { getCurrentSession } from "@/lib/auth-server";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  applicationName: "SelfOS",
  title: "SelfOS",
  description: "A personal growth operating system for health, productivity, learning, and money.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SelfOS"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "apple-mobile-web-app-capable": "yes"
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#0b1220"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} min-h-screen bg-surface text-ink antialiased`}>
        <AppShell user={session?.user ?? null}>{children}</AppShell>
        <PwaInstaller />
      </body>
    </html>
  );
}
