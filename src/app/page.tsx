import { CheckCircle2, Dumbbell, NotebookPen } from "lucide-react";
import { analyticsSeries, nutritionSummary } from "@/lib/analytics";
import { getSelfOsData } from "@/lib/selfos-data";
import { requireUser } from "@/lib/auth-server";
import { average, currency, percent, shortDate, sum } from "@/lib/utils";
import { Card, EmptyState, PageHeader, ProgressBar, SectionTitle, StatCard } from "@/components/ui";
import { HabitCompletionChart, MoodTrendChart } from "@/components/charts";
import { CoachPanel } from "@/components/coach-panel";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const nutrition = nutritionSummary(data.meals);
  const latest = data.checkIns[0];
  const latestWorkout = data.workoutLogs[0];
  const todayHabits = data.habits.filter((habit) => habit.completedToday).length;
  const weeklyConsistency = average(data.habits.map((habit) => habit.weeklyCompletion));
  const goalProgress = average(data.goals.map((goal) => goal.progressPercentage));
  const learningMinutes = sum(data.learningItems.map((item) => item.studyMinutes));
  const expenses = sum(data.financeTransactions.filter((tx) => tx.type !== "income").map((tx) => tx.amount));
  const income = sum(data.financeTransactions.filter((tx) => tx.type === "income").map((tx) => tx.amount));
  const series = analyticsSeries(data);

  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Daily Dashboard"
        description="A single operating view for health, training, learning, goals, mood, and money."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Habits Done" value={`${todayHabits}/${data.habits.length}`} detail="Today" tone="green" />
        <StatCard label="Calories" value={nutrition.calories} detail={`${nutrition.protein}g protein`} tone="blue" />
        <StatCard label="Mood" value={latest ? `${latest.moodScore}/10` : "No log"} detail={latest ? `${latest.sleepHours}h sleep` : "Add a check-in"} tone="green" />
        <StatCard label="Weekly Consistency" value={percent(weeklyConsistency)} detail="Habit average" tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle title="Today's Status" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-line p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Dumbbell size={18} className="text-evergreen" />
                Planned Workout
              </div>
              {latestWorkout ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span>{latestWorkout.title}</span>
                    <span className="text-muted">{latestWorkout.durationMinutes} min</span>
                  </div>
                  <p className="text-muted">Performance {latestWorkout.performanceTrend}</p>
                </div>
              ) : (
                <EmptyState title="No workout logged yet" body="Create a workout log when your first session is complete." />
              )}
            </div>
            <div className="rounded-lg border border-line p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <CheckCircle2 size={18} className="text-evergreen" />
                Habits
              </div>
              <div className="space-y-3">
                {data.habits.length ? data.habits.map((habit) => (
                  <div key={habit.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{habit.name}</span>
                      <span className="text-muted">{habit.completedToday ? "Done" : "Open"}</span>
                    </div>
                    <ProgressBar value={habit.weeklyCompletion} />
                  </div>
                )) : <EmptyState title="No habits yet" body="Add a habit to begin measuring consistency." />}
              </div>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="font-semibold">Nutrition and Hydration</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted">Meals</dt><dd className="font-semibold">{latest ? data.meals.filter((meal) => meal.date === latest.date).length : 0}</dd></div>
                <div><dt className="text-muted">Protein</dt><dd className="font-semibold">{nutrition.protein}g</dd></div>
                <div><dt className="text-muted">Carbs</dt><dd className="font-semibold">{nutrition.carbs}g</dd></div>
                <div><dt className="text-muted">Water</dt><dd className="font-semibold">{Math.max(nutrition.water, latest?.waterIntakeLiters ?? 0).toFixed(1)}L</dd></div>
              </dl>
            </div>
            <div className="rounded-lg border border-line p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <NotebookPen size={18} className="text-evergreen" />
                Reflection and Progress
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted">Journal</dt><dd className="font-semibold">{latest && data.journalEntries.some((entry) => entry.date === latest.date) ? "Complete" : "Open"}</dd></div>
                <div><dt className="text-muted">Goals</dt><dd className="font-semibold">{percent(goalProgress)}</dd></div>
                <div><dt className="text-muted">Learning</dt><dd className="font-semibold">{learningMinutes} min</dd></div>
                <div><dt className="text-muted">Finance</dt><dd className="font-semibold">{currency(income - expenses)}</dd></div>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Recent Insights" subtitle={`Updated ${shortDate(new Date())}`} />
          {data.insights.length ? (
            <div className="space-y-3">
              {data.insights.map((insight) => (
              <div key={insight.id} className="rounded-lg border border-line bg-surface p-3">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{insight.body}</p>
              </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No insights yet" body="Insights appear after you have enough personal logs to compare patterns." />
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <MoodTrendChart data={series.moodLogs} />
        <HabitCompletionChart data={series.habits} />
      </div>

      <div className="mt-5">
        <CoachPanel data={data} />
      </div>
    </>
  );
}
