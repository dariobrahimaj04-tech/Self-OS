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

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const series = analyticsSeries(data);
  const insights = patternInsights(data);

  return (
    <>
      <PageHeader
        eyebrow="Pattern finder"
        title="Analytics"
        description="Charts and simple written insights across mood, sleep, workouts, protein, habits, study, goals, spending, and stress."
      />
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
