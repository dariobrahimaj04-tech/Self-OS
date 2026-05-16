import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  eyebrow,
  description,
  action
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mineral">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-normal text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("min-w-0 rounded-lg border border-line bg-panel/95 p-4 shadow-soft", className)}>{children}</section>;
}

export function StatCard({
  label,
  value,
  detail,
  tone = "default"
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "default" | "green" | "blue" | "amber" | "red";
}) {
  const tones = {
    default: "border-line",
    green: "border-evergreen/30 bg-evergreen/10",
    blue: "border-mineral/30 bg-mineral/10",
    amber: "border-gold/30 bg-gold/10",
    red: "border-ember/30 bg-ember/10"
  };

  return (
    <div className={cn("rounded-lg border bg-panel p-4", tones[tone])}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold tracking-normal text-ink">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  label
}: {
  value: number;
  label?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-evergreen shadow-[0_0_16px_rgba(34,197,94,0.24)]" style={{ width: `${safeValue}%` }} />
      </div>
      {label ? <p className="mt-1 text-xs text-muted">{label}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface p-5 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
