"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className,
  contentMode = "inside"
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  contentMode?: "inside" | "outside";
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (contentMode === "outside") {
    return (
      <div className={className}>
        <Card>
          <button
            className="focus-ring flex w-full items-start justify-between gap-4 rounded-md text-left"
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
          >
            <SectionTitle title={title} subtitle={subtitle} />
            <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-muted transition-colors hover:text-ink">
              <ChevronDown size={18} className={cn("transition-transform", open && "rotate-180")} />
            </span>
          </button>
        </Card>
        {open ? <div className="mt-3">{children}</div> : null}
      </div>
    );
  }

  return (
    <Card className={className}>
      <button
        className="focus-ring flex w-full items-start justify-between gap-4 rounded-md text-left"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <SectionTitle title={title} subtitle={subtitle} />
        <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-muted transition-colors hover:text-ink">
          <ChevronDown size={18} className={cn("transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open ? <div className="pt-1">{children}</div> : null}
    </Card>
  );
}
