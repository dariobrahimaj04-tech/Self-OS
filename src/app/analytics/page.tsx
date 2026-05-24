import Link from "next/link";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import {
  AreaTrendChart,
  HabitCompletionChart,
  MoodTrendChart,
  SimpleBarChart,
  SleepMoodChart,
  WorkoutPerformanceChart
} from "@/components/charts";
import { Card, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { analyticsSeries, patternInsights } from "@/lib/analytics";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";
import { buildWeeklyReview, type ReviewTone } from "@/lib/weekly-review";

function reviewToneClass(tone: ReviewTone) {
  const tones = {
    default: "border-line bg-surface text-muted",
    green: "border-evergreen/25 bg-evergreen/10 text-evergreen",
    blue: "border-mineral/25 bg-mineral/10 text-mineral",
    amber: "border-gold/25 bg-gold/10 text-gold",
    red: "border-ember/25 bg-ember/10 text-ember"
  };

  return tones[tone];
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const series = analyticsSeries(data);
  const insights = patternInsights(data);
  const weeklyReview = buildWeeklyReview(data);

  return (
    <>
      <PageHeader
        eyebrow="Pattern finder"
        title="Analytics"
        description="Charts and simple written insights across mood, sleep, workouts, protein, habits, study, goals, spending, and stress."
        action={
          <Link href="/review" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90">
            Weekly review
            <ArrowRight size={16} />
          </Link>
        }
      />
      <Card className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mineral/10 text-mineral ring-1 ring-mineral/25">
              <CalendarCheck2 size={20} />
            </span>
            <div>
              <SectionTitle title="Weekly Review Snapshot" subtitle={`${weeklyReview.weekRange}. Generated from your current SelfOS logs.`} />
              <p className="text-sm leading-6 text-muted">{weeklyReview.momentumDetail}</p>
            </div>
          </div>
          <Link href="/review" className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-zinc-800/80">
            Open full review
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className={`rounded-lg border p-3 ${reviewToneClass(weeklyReview.momentumTone)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Momentum</p>
            <p className="mt-2 font-semibold text-ink">{weeklyReview.momentumLabel}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Avg Daily Score</p>
            <p className="mt-2 font-semibold text-ink">{Math.round(weeklyReview.current.averageDailyScore)}/100</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Next Focus</p>
            <p className="mt-2 font-semibold text-ink">{weeklyReview.focus[0]?.title ?? "Keep tracking"}</p>
          </div>
        </div>
      </Card>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {insights.slice(0, 3).map((insight) => (
          <StatCard key={insight.title} label={insight.title} value={insight.value.toFixed(2)} detail="Correlation" tone={Math.abs(insight.value) > 0.4 ? "green" : "amber"} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <MoodTrendChart data={series.moodLogs} />
        <SleepMoodChart data={series.sleepVsMood} />
        <WorkoutPerformanceChart data={series.workoutConsistency} />
        <HabitCompletionChart data={series.habits} />
        <SimpleBarChart title="Study Hours" data={series.learning} xKey="name" yKey="minutes" />
        <SimpleBarChart title="Goal Progress" data={series.goalProgress} xKey="name" yKey="progress" />
        <SimpleBarChart title="Spending by Category" data={series.spendingByCategory} xKey="category" yKey="amount" />
        <AreaTrendChart title="Stress Over Time" data={series.sleepVsMood} keys={["stress", "productivity"]} />
      </div>
      <Card className="mt-5">
        <SectionTitle title="Written Insights" />
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <div key={insight.title} className="rounded-lg border border-line bg-surface p-3">
              <p className="font-medium text-ink">{insight.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{insight.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
