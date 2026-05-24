import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Award,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert
} from "lucide-react";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";
import { buildWeeklyReview, type ReviewTone, type WeeklyReviewItem, type WeeklyReviewMetric } from "@/lib/weekly-review";
import { Card, EmptyState, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";

function toneClasses(tone: ReviewTone = "default") {
  const tones = {
    default: "border-line bg-surface text-muted",
    green: "border-evergreen/25 bg-evergreen/10 text-evergreen",
    blue: "border-mineral/25 bg-mineral/10 text-mineral",
    amber: "border-gold/25 bg-gold/10 text-gold",
    red: "border-ember/25 bg-ember/10 text-ember"
  };

  return tones[tone];
}

function ReviewPill({ children, tone = "default" }: { children: ReactNode; tone?: ReviewTone }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(tone)}`}>{children}</span>;
}

function MetricCard({ metric }: { metric: WeeklyReviewMetric }) {
  return (
    <div className={`rounded-lg border p-4 ${toneClasses(metric.tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{metric.value}</p>
      <p className="mt-1 text-sm leading-5 text-muted">{metric.detail}</p>
      {typeof metric.progress === "number" ? (
        <div className="mt-3">
          <ProgressBar value={metric.progress} />
        </div>
      ) : null}
    </div>
  );
}

function ReviewList({
  title,
  subtitle,
  items,
  empty,
  icon
}: {
  title: string;
  subtitle?: string;
  items: WeeklyReviewItem[];
  empty: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-2">
        {icon ? <div className="mt-1 shrink-0 text-mineral">{icon}</div> : null}
        <SectionTitle title={title} subtitle={subtitle} />
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <ReviewPill tone={item.tone}>{item.tone ?? "note"}</ReviewPill>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
              </>
            );

            return item.href ? (
              <Link key={`${title}-${item.title}`} href={item.href} className="focus-ring group block rounded-lg border border-line bg-surface p-3 transition-colors hover:border-mineral/50 hover:bg-zinc-800/80">
                {content}
              </Link>
            ) : (
              <div key={`${title}-${item.title}`} className="rounded-lg border border-line bg-surface p-3">
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No review notes yet" body={empty} />
      )}
    </Card>
  );
}

export default async function WeeklyReviewPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const review = buildWeeklyReview(data);

  return (
    <>
      <PageHeader
        eyebrow="Weekly Review"
        title="Weekly Review Generator"
        description="A rule-based summary of this week's progress, patterns, wins, challenges, and practical focus areas."
        action={
          <Link href="/journal" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90">
            Save reflection in Journal
            <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-mineral">
                <CalendarCheck2 size={18} />
                {review.weekRange}
              </div>
              <h2 className="text-3xl font-semibold tracking-normal text-ink">{review.momentumLabel}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{review.momentumDetail}</p>
            </div>
            <ReviewPill tone={review.momentumTone}>Generated {review.generatedAt}</ReviewPill>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Daily Score</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{Math.round(review.current.averageDailyScore)}/100</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Activity</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{review.current.activityCount}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Review Window</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{review.current.dates.length}d</p>
            </div>
          </div>
        </Card>

        <ReviewList
          title="Trend Comparison"
          subtitle={review.hasComparison ? `Compared with ${review.previousWeekRange}.` : "Comparison appears once last week's logs exist."}
          items={review.trends}
          empty="Add one more week of data to unlock trend comparison."
          icon={<TrendingUp size={18} />}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {review.overview.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ReviewList
          title="Streak Changes"
          subtitle="Current streaks calculated from this week's private logs."
          items={review.streakChanges}
          empty="Streaks appear after completed module activity."
          icon={<Flame size={18} />}
        />
        <ReviewList
          title="Achievements Unlocked"
          subtitle="Milestones that unlocked automatically from existing history."
          items={review.achievementsUnlocked}
          empty="No achievements unlocked in this review window."
          icon={<Award size={18} />}
        />
        <ReviewList
          title="Consistency Summary"
          subtitle="A calm read on momentum, without noisy gamification."
          items={review.consistencySummary}
          empty="Consistency notes appear once several systems have data."
          icon={<Sparkles size={18} />}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ReviewList
          title="Wins This Week"
          subtitle="Concise signals worth repeating."
          items={review.wins}
          empty="Wins appear once SelfOS sees completed workouts, logs, goals, or habits."
          icon={<CheckCircle2 size={18} />}
        />
        <ReviewList
          title="Challenges"
          subtitle="Supportive flags, not judgments."
          items={review.challenges}
          empty="No major challenge surfaced from the current data."
          icon={<TriangleAlert size={18} />}
        />
        <ReviewList
          title="Focus For Next Week"
          subtitle="Keep the next adjustment short and practical."
          items={review.focus}
          empty="SelfOS will recommend focus areas after more weekly data is logged."
          icon={<Target size={18} />}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ReviewList
          title="Mood and Pattern Notes"
          subtitle="Simple patterns from sleep, mood, stress, nutrition, workouts, and habits."
          items={review.patterns}
          empty="More check-ins will make pattern notes more useful."
          icon={<Sparkles size={18} />}
        />
        <ReviewList
          title="Recent Activity Summary"
          subtitle="Module-level activity from the current week."
          items={review.activitySummary}
          empty="Log activity in SelfOS modules to fill this summary."
          icon={<ClipboardList size={18} />}
        />
      </div>

      <div className="mt-5 rounded-lg border border-line bg-panel/70 p-4 text-sm leading-6 text-muted">
        This review is generated from existing user-scoped SelfOS data and is not stored automatically. Use the Journal page if you want to save a permanent weekly reflection.
      </div>
    </>
  );
}
