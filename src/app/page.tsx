import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Goal,
  NotebookPen,
  Salad,
  Sparkles,
  Target,
  Utensils
} from "lucide-react";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData, type SelfOsData } from "@/lib/selfos-data";
import type { GoalView } from "@/lib/types";
import { average, percent, shortDate, sum, todayIso } from "@/lib/utils";
import { Card, EmptyState, PageHeader, ProgressBar, SectionTitle, StatCard } from "@/components/ui";

type DashboardItem = {
  title: string;
  detail: string;
  href: string;
  cta: string;
  tone: "green" | "blue" | "amber" | "red" | "default";
};

type ActivityItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  date: string;
  href: string;
};

const priorityWeight: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1
};

function activeGoals(goals: GoalView[]) {
  return goals
    .filter((goal) => goal.status !== "Completed" && goal.progressPercentage < 100)
    .sort((a, b) => {
      const priorityDelta = (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0);
      return priorityDelta || a.progressPercentage - b.progressPercentage;
    });
}

function buildFocusItems(data: SelfOsData, today: string): DashboardItem[] {
  const habitsDue = data.habits.filter((habit) => !habit.completedToday);
  const goals = activeGoals(data.goals);
  const mealsToday = data.meals.filter((meal) => meal.date === today);
  const moodLogged = data.moodLogs.some((entry) => entry.date === today) || data.checkIns.some((entry) => entry.date === today);
  const workoutLogged = data.workoutLogs.some((log) => log.date === today);
  const items: DashboardItem[] = [];

  if (goals[0]) {
    const nextTask = goals[0].tasks[0] ? `Next task: ${goals[0].tasks[0]}` : `${goals[0].progressPercentage}% complete`;
    items.push({
      title: goals[0].title,
      detail: `${goals[0].priority} priority goal. ${nextTask}`,
      href: "/goals",
      cta: "Update goal",
      tone: goals[0].priority === "High" ? "amber" : "blue"
    });
  }

  if (habitsDue.length) {
    items.push({
      title: `${habitsDue.length} habit${habitsDue.length === 1 ? "" : "s"} still due`,
      detail: habitsDue.slice(0, 3).map((habit) => habit.name).join(", "),
      href: "/habits",
      cta: "Check habits",
      tone: "green"
    });
  }

  if (!workoutLogged) {
    items.push({
      title: data.activeWorkoutPlan ? "Workout is ready when you are" : "No workout logged today",
      detail: data.activeWorkoutPlan ? `Active plan: ${data.activeWorkoutPlan.name}` : "Open Fitness to start or log today's training.",
      href: "/fitness",
      cta: data.activeWorkoutPlan ? "Start workout" : "Open fitness",
      tone: "blue"
    });
  }

  if (!mealsToday.length) {
    items.push({
      title: "No meals logged today",
      detail: "Add your first meal so nutrition status reflects today instead of older logs.",
      href: "/nutrition",
      cta: "Log meal",
      tone: "amber"
    });
  }

  if (!moodLogged) {
    items.push({
      title: "Mood check-in is open",
      detail: "Add a quick mood or daily check-in to anchor today's trend data.",
      href: "/mood",
      cta: "Add mood",
      tone: "default"
    });
  }

  if (!items.length) {
    items.push({
      title: "Today is up to date",
      detail: "Your core logs are covered. Review progress or choose the next meaningful task.",
      href: "/goals",
      cta: "Review goals",
      tone: "green"
    });
  }

  return items.slice(0, 3);
}

function buildInsights(data: SelfOsData, today: string) {
  const insights: string[] = [];
  const habitsDue = data.habits.filter((habit) => !habit.completedToday);
  const goals = activeGoals(data.goals);
  const moodLogged = data.moodLogs.some((entry) => entry.date === today) || data.checkIns.some((entry) => entry.date === today);
  const mealsToday = data.meals.filter((meal) => meal.date === today);
  const workoutLogged = data.workoutLogs.some((log) => log.date === today);

  if (habitsDue.length) insights.push(`You have ${habitsDue.length} habit${habitsDue.length === 1 ? "" : "s"} still due today.`);
  if (!moodLogged) insights.push("You have no mood check-in yet.");
  if (goals.length) insights.push(`${goals.length} active goal${goals.length === 1 ? " needs" : "s need"} progress attention.`);
  if (!workoutLogged) insights.push(data.activeWorkoutPlan ? "Start your next workout when ready." : "No workout is logged for today.");
  if (!mealsToday.length) insights.push("Nutrition is empty for today, so daily totals may be incomplete.");
  if (!data.habits.length && !data.goals.length && !data.meals.length) insights.push("Add a habit, goal, or meal to make the dashboard more useful.");

  return insights.slice(0, 5);
}

function buildRecentActivity(data: SelfOsData): ActivityItem[] {
  const activities: ActivityItem[] = [
    ...data.meals.slice(0, 5).map((meal) => ({
      id: `meal-${meal.id}`,
      label: "Nutrition",
      title: meal.foodName,
      detail: `${meal.calories} cal, ${meal.protein}g protein`,
      date: meal.date,
      href: "/nutrition"
    })),
    ...data.workoutLogs.slice(0, 5).map((log) => ({
      id: `workout-${log.id}`,
      label: "Fitness",
      title: log.title,
      detail: `${log.durationMinutes} min, performance ${log.performanceTrend}`,
      date: log.date,
      href: "/fitness"
    })),
    ...data.moodLogs.slice(0, 5).map((entry) => ({
      id: `mood-${entry.id ?? entry.date}`,
      label: "Mood",
      title: `Mood ${entry.mood}/10`,
      detail: `Energy ${entry.energy}/10, stress ${entry.stress}/10`,
      date: entry.date,
      href: "/mood"
    })),
    ...data.checkIns.slice(0, 5).map((entry) => ({
      id: `check-in-${entry.date}`,
      label: "Check-In",
      title: `Daily check-in`,
      detail: `Mood ${entry.moodScore}/10, sleep ${entry.sleepHours}h`,
      date: entry.date,
      href: "/check-in"
    })),
    ...data.journalEntries.slice(0, 5).map((entry) => ({
      id: `journal-${entry.id}`,
      label: "Journal",
      title: entry.title,
      detail: entry.completed ? "Completed reflection" : "Draft reflection",
      date: entry.date,
      href: "/journal"
    }))
  ];

  return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
}

function StatusPill({ children, tone = "default" }: { children: ReactNode; tone?: DashboardItem["tone"] }) {
  const tones = {
    default: "border-line bg-surface text-muted",
    green: "border-evergreen/25 bg-evergreen/10 text-evergreen",
    blue: "border-mineral/25 bg-mineral/10 text-mineral",
    amber: "border-gold/25 bg-gold/10 text-gold",
    red: "border-ember/25 bg-ember/10 text-ember"
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function QuickAction({
  href,
  label,
  detail,
  icon: Icon
}: {
  href: string;
  label: string;
  detail: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="focus-ring group flex min-h-20 items-center gap-3 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-mineral/40 hover:bg-zinc-800/80"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-mineral/10 text-mineral">
        <Icon size={19} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted">{detail}</span>
      </span>
      <ArrowRight size={16} className="ml-auto shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const today = todayIso();
  const focusItems = buildFocusItems(data, today);
  const insights = buildInsights(data, today);
  const recentActivity = buildRecentActivity(data);
  const todayMeals = data.meals.filter((meal) => meal.date === today);
  const nutrition = {
    calories: sum(todayMeals.map((meal) => meal.calories)),
    protein: sum(todayMeals.map((meal) => meal.protein)),
    carbs: sum(todayMeals.map((meal) => meal.carbs))
  };
  const habitsDone = data.habits.filter((habit) => habit.completedToday).length;
  const habitsDue = Math.max(data.habits.length - habitsDone, 0);
  const goalAverage = average(activeGoals(data.goals).map((goal) => goal.progressPercentage));
  const moodLogged = data.moodLogs.some((entry) => entry.date === today) || data.checkIns.some((entry) => entry.date === today);
  const workoutLogged = data.workoutLogs.some((log) => log.date === today);
  const nextAction = focusItems[0];

  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Today Dashboard"
        description="A focused operating view for what needs attention, what is already handled, and the next useful action."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Workout" value={workoutLogged ? "Logged" : "Open"} detail={data.activeWorkoutPlan?.name ?? "Fitness tracker"} tone={workoutLogged ? "green" : "blue"} />
        <StatCard label="Nutrition" value={todayMeals.length ? `${todayMeals.length} meals` : "No meals"} detail={`${nutrition.protein}g protein, ${nutrition.carbs}g carbs`} tone={todayMeals.length ? "green" : "amber"} />
        <StatCard label="Habits" value={`${habitsDone}/${data.habits.length}`} detail={habitsDue ? `${habitsDue} due today` : "All clear"} tone={habitsDue ? "amber" : "green"} />
        <StatCard label="Mood" value={moodLogged ? "Checked in" : "Open"} detail={moodLogged ? "Today's mood is logged" : "Add a mood entry"} tone={moodLogged ? "green" : "default"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle title="Today's Focus" subtitle="Top priorities are selected from incomplete habits, active goals, logs, and the current workout plan." />
            <StatusPill tone={nextAction.tone}>Next: {nextAction.cta}</StatusPill>
          </div>
          <div className="grid gap-3">
            {focusItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-panel text-sm font-semibold text-mineral">{index + 1}</span>
                      <StatusPill tone={item.tone}>{item.cta}</StatusPill>
                    </div>
                    <h2 className="text-lg font-semibold tracking-normal text-ink">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90"
                  >
                    {item.cta}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Quick Actions" subtitle="Jump straight into the module that needs the next update." />
          <div className="grid gap-3">
            <QuickAction href="/nutrition" label="Log meal" detail="Add food, macros, and notes." icon={Utensils} />
            <QuickAction href="/fitness" label="Start workout" detail="Open the active plan or workout log." icon={Dumbbell} />
            <QuickAction href="/habits" label="Check habits" detail="Review today's completions." icon={CheckCircle2} />
            <QuickAction href="/mood" label="Add mood entry" detail="Capture mood, stress, and energy." icon={Brain} />
            <QuickAction href="/goals" label="Update goal progress" detail="Move an active priority forward." icon={Goal} />
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionTitle title="Today's Snapshot" subtitle={`Updated ${shortDate(today)}`} />
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-surface p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-semibold">Goal progress</p>
                <StatusPill tone={goalAverage ? "blue" : "default"}>{goalAverage ? percent(goalAverage) : "No active goals"}</StatusPill>
              </div>
              <ProgressBar value={goalAverage} label={goalAverage ? "Average active goal progress" : "Create an active goal to show progress here"} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Dumbbell size={17} className="text-mineral" />
                  Workout
                </div>
                <p className="text-sm leading-6 text-muted">{workoutLogged ? "Workout is logged for today." : data.activeWorkoutPlan ? `${data.activeWorkoutPlan.name} is ready.` : "No workout logged yet."}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Salad size={17} className="text-evergreen" />
                  Nutrition
                </div>
                <p className="text-sm leading-6 text-muted">{todayMeals.length ? `${todayMeals.length} meal${todayMeals.length === 1 ? "" : "s"} logged today, ${nutrition.calories} estimated calories.` : "No meals logged today."}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <ClipboardList size={17} className="text-gold" />
                  Habits
                </div>
                <p className="text-sm leading-6 text-muted">{data.habits.length ? `${habitsDone} complete, ${habitsDue} still open.` : "No habits are being tracked yet."}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <NotebookPen size={17} className="text-mineral" />
                  Mood
                </div>
                <p className="text-sm leading-6 text-muted">{moodLogged ? "Mood data is present for today." : "No mood check-in yet."}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-mineral" />
            <SectionTitle title="Basic Insights" subtitle="Simple rule-based prompts from today's data. No external AI is used." />
          </div>
          {insights.length ? (
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight} className="rounded-lg border border-line bg-surface p-3 text-sm leading-6 text-muted">
                  {insight}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No attention flags" body="Today's core logs look covered. Keep moving through your normal routine." />
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle title="Recent Activity" subtitle="Latest logs and updates from your connected modules." />
            <Link href="/analytics" className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-zinc-800/80">
              View analytics
              <ArrowRight size={15} />
            </Link>
          </div>
          {recentActivity.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentActivity.map((activity) => (
                <Link key={activity.id} href={activity.href} className="focus-ring rounded-lg border border-line bg-surface p-4 transition-colors hover:border-mineral/40 hover:bg-zinc-800/80">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <StatusPill>{activity.label}</StatusPill>
                    <span className="text-xs text-muted">{shortDate(activity.date)}</span>
                  </div>
                  <p className="truncate font-semibold text-ink">{activity.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{activity.detail}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No activity yet" body="Log a meal, workout, habit, mood entry, or check-in to populate this feed." />
          )}
        </Card>
      </div>

      <div className="mt-5 rounded-lg border border-line bg-panel/70 p-4 text-sm leading-6 text-muted">
        <div className="flex gap-3">
          <Target size={18} className="mt-0.5 shrink-0 text-mineral" />
          <p>
            This dashboard is a read-only foundation. It summarizes existing SelfOS data and routes you to the module where each action should be completed.
          </p>
        </div>
      </div>
    </>
  );
}
