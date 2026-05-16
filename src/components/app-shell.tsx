"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Goal,
  Home,
  Landmark,
  LogOut,
  Menu,
  NotebookPen,
  Salad,
  Settings,
  Sparkles,
  User,
  X
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/check-in", label: "Daily Check-In", icon: ClipboardList },
  { href: "/fitness", label: "Fitness", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/mood", label: "Mood", icon: Brain },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/habits", label: "Habits", icon: CheckCircle2 },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/learning", label: "Learning", icon: BookOpen },
  { href: "/finance", label: "Finance", icon: Landmark },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings }
];

type ShellUser = {
  name?: string | null;
  email?: string | null;
};

export function AppShell({ children, user }: { children: React.ReactNode; user?: ShellUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const publicPath = pathname === "/login" || pathname === "/signup";

  if (publicPath) {
    return <div className="min-h-screen bg-surface text-ink">{children}</div>;
  }

  async function logout() {
    await signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen min-w-0 lg:grid lg:grid-cols-[276px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[276px] max-w-[calc(100vw-2rem)] overflow-y-auto border-r border-line bg-panel px-4 py-5 shadow-soft transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-mineral text-[#041018]">
              <Activity size={21} />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-normal">SelfOS</span>
              <span className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">Personal operating system</span>
            </span>
          </Link>
          <button
            className="focus-ring rounded-md p-2 text-muted lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 font-semibold text-white shadow-sm ring-1 ring-blue-400/40"
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-3">
          {user ? (
            <div className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-600 text-white ring-1 ring-blue-400/40">
                  <User size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{user.name || "SelfOS user"}</p>
                  {user.email ? <p className="truncate text-xs text-muted">{user.email}</p> : null}
                </div>
              </div>
              <button
                className="focus-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-white"
                type="button"
                onClick={logout}
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          ) : null}
          <div className="rounded-lg border border-line bg-surface p-3 text-xs leading-5 text-muted">
            Conservative recommendations. Pain, injury, or major diet changes belong with qualified professionals.
          </div>
        </div>
      </aside>

        {open ? <button className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
          <button className="focus-ring rounded-md p-2.5 text-ink" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu size={22} />
          </button>
          <span className="font-semibold">SelfOS</span>
          <button className="focus-ring rounded-md p-2.5 text-muted hover:text-white" type="button" onClick={logout} aria-label="Log out">
            <LogOut size={20} />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
