import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  Dumbbell,
  Flame,
  Goal,
  NotebookPen,
  Salad,
  Sparkles,
  Target,
  Utensils,
  WalletCards
} from "lucide-react";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData, type SelfOsData } from "@/lib/selfos-data";
import type { GeneratedWorkoutPlan, GoalView, HabitView } from "@/lib/types";
import { average, currency, percent, shortDate, sum, todayIso } from "@/lib/utils";
import { Card, EmptyState, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";
import { CurrentStreaksWidget, RecentAchievementsWidget } from "@/components/streak-achievement-widgets";
import { buildStreakAchievementSummary } from "@/lib/streaks-achievements";

type DashboardTone = "green" | "blue" | "amber" | "red" | "default";

type DashboardItem = {
  title: string;
  detail: string;
  href: string;
  cta: string;
  tone: DashboardTone;
};

type ActivityItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  date: string;
  href: string;
};

type DailyScoreCategory = {
  label: string;
  detail: string;
  points: number;
  max: number;
  available: boolean;
  href: string;
  action: string;
  tone: DashboardTone;
};

type DailyScoreResult = {
  score: number;
  label: string;
  tone: DashboardTone;
  explanation: string;
  suggestion: string;
  suggestionHref: string;
  trend: string;
  categories: DailyScoreCategory[];
  recoveryBonus: {
    available: boolean;
    points: number;
    max: number;
    detail: string;
  };
};

type TopPriority = {
  title: string;
  detail: string;
  href: string;
};

const priorityWeight: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1
};

function boundedScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function categoryTone(points: number, max: number): DashboardTone {
  if (!max) return "default";
  const ratio = points / max;
  if (ratio >= 0.85) return "green";
  if (ratio >= 0.6) return "blue";
  if (ratio >= 0.35) return "amber";
  return "red";
}

function dailyScoreLabel(score: number, availableCategories: number) {
  if (!availableCategories) return { label: "Needs Data", tone: "default" as const };
  if (score >= 85) return { label: "Excellent", tone: "green" as const };
  if (score >= 70) return { label: "Good", tone: "blue" as const };
  return { label: "Needs Attention", tone: score >= 50 ? "amber" as const : "red" as const };
}

function activeGoals(goals: GoalView[]) {
  return goals
    .filter((goal) => goal.status !== "Completed" && goal.progressPercentage < 100)
    .sort((a, b) => {
      const priorityDelta = (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0);
      return priorityDelta || a.progressPercentage - b.progressPercentage;
    });
}

function isWithinDays(date: string, days: number) {
  const current = new Date(`${date}T12:00:00`);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  threshold.setHours(0, 0, 0, 0);
  return current >= threshold;
}

function plannedWorkoutForToday(plan: GeneratedWorkoutPlan | null) {
  if (!plan?.days.length) return null;
  const dayCode = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date());
  const layoutMatch = plan.weeklyLayout?.find((day) => day.day === dayCode && day.training);
  const day = layoutMatch ? plan.days.find((item) => item.name === layoutMatch.name) : plan.days[0];
  if (!day) return null;

  return {
    name: day.name,
    focusMuscles: day.focusMuscles,
    exerciseCount: day.exercises.length,
    scheduled: Boolean(layoutMatch)
  };
}

function momentumLabel(score: number, recoveryLow: boolean, openCoreActions: number) {
  if (recoveryLow) return "Recovery-focused day";
  if (score >= 88 && openCoreActions === 0) return "Excellent discipline today";
  if (score >= 75) return "Strong momentum";
  if (score >= 50) return "Building consistency";
  return "Needs attention";
}

function buildDailyScore(data: SelfOsData, today: string): DailyScoreResult {
  const todayMeals = data.meals.filter((meal) => meal.date === today);
  const todayCheckIn = data.checkIns.find((entry) => entry.date === today);
  const moodLogged = data.moodLogs.some((entry) => entry.date === today) || Boolean(todayCheckIn);
  const workoutLogged = data.workoutLogs.some((log) => log.date === today);
  const goals = activeGoals(data.goals);
  const categories: DailyScoreCategory[] = [];

  if (data.habits.length) {
    const completed = data.habits.filter((habit) => habit.completedToday).length;
    const points = Math.round((completed / data.habits.length) * 25);
    categories.push({
      label: "Habits completion",
      detail: `${completed} of ${data.habits.length} habits complete today.`,
      points,
      max: 25,
      available: true,
      href: "/habits",
      action: "Check habits",
      tone: categoryTone(points, 25)
    });
  } else {
    categories.push({
      label: "Habits completion",
      detail: "No habits are being tracked yet. Add one small habit to include this category.",
      points: 0,
      max: 25,
      available: false,
      href: "/habits",
      action: "Create habit",
      tone: "default"
    });
  }

  if (workoutLogged || data.activeWorkoutPlan || data.workoutLogs.length) {
    const points = workoutLogged ? 20 : data.activeWorkoutPlan ? 8 : 6;
    categories.push({
      label: "Workout / fitness activity",
      detail: workoutLogged
        ? "Workout activity is logged for today."
        : data.activeWorkoutPlan
          ? `${data.activeWorkoutPlan.name} is ready, but no workout is logged today.`
          : "Fitness history exists, but no workout is logged today.",
      points,
      max: 20,
      available: true,
      href: "/fitness",
      action: workoutLogged ? "Review workout" : "Start workout",
      tone: categoryTone(points, 20)
    });
  } else {
    categories.push({
      label: "Workout / fitness activity",
      detail: "No workout plan or log exists yet. Open Fitness to generate or log training.",
      points: 0,
      max: 20,
      available: false,
      href: "/fitness",
      action: "Open fitness",
      tone: "default"
    });
  }

  if (data.meals.length) {
    const points = todayMeals.length >= 3 ? 20 : todayMeals.length === 2 ? 17 : todayMeals.length === 1 ? 12 : 5;
    categories.push({
      label: "Nutrition logging",
      detail: todayMeals.length
        ? `${todayMeals.length} meal${todayMeals.length === 1 ? "" : "s"} logged today.`
        : "No meals logged yet today. Start by logging breakfast or your first meal.",
      points,
      max: 20,
      available: true,
      href: "/nutrition",
      action: "Log meal",
      tone: categoryTone(points, 20)
    });
  } else {
    categories.push({
      label: "Nutrition logging",
      detail: "No nutrition data yet. Log your first meal to activate this category.",
      points: 0,
      max: 20,
      available: false,
      href: "/nutrition",
      action: "Log meal",
      tone: "default"
    });
  }

  if (data.moodLogs.length || data.checkIns.length) {
    const points = moodLogged ? 15 : 5;
    categories.push({
      label: "Mood check-in",
      detail: moodLogged ? "Mood or daily check-in is logged for today." : "Mood check-in still pending.",
      points,
      max: 15,
      available: true,
      href: "/check-in",
      action: "Add check-in",
      tone: categoryTone(points, 15)
    });
  } else {
    categories.push({
      label: "Mood check-in",
      detail: "No mood data yet. Add a mood entry or daily check-in to include this category.",
      points: 0,
      max: 15,
      available: false,
      href: "/check-in",
      action: "Add check-in",
      tone: "default"
    });
  }

  if (data.goals.length) {
    const active = goals.length;
    const hasProgressSignal = goals.some((goal) => goal.progressPercentage > 0 || Boolean(goal.weeklyReviewNotes));
    const avgProgress = average(goals.map((goal) => goal.progressPercentage));
    const points = active ? Math.min(15, hasProgressSignal ? Math.max(8, Math.round(6 + avgProgress * 0.09)) : 5) : 15;
    categories.push({
      label: "Goal progress updates",
      detail: active
        ? "Using current goal progress and weekly review notes because per-day goal update timestamps are not stored yet."
        : "No active goals need updates right now.",
      points,
      max: 15,
      available: true,
      href: "/goals",
      action: active ? "Update goal" : "Review goals",
      tone: categoryTone(points, 15)
    });
  } else {
    categories.push({
      label: "Goal progress updates",
      detail: "No goals yet. Add an active goal to give the dashboard a priority anchor.",
      points: 0,
      max: 15,
      available: false,
      href: "/goals",
      action: "Create goal",
      tone: "default"
    });
  }

  let recoveryBonus = {
    available: false,
    points: 0,
    max: 5,
    detail: "No sleep or recovery data is available for today's supporting bonus."
  };

  if (todayCheckIn) {
    const sleepHoursBonus = todayCheckIn.sleepHours >= 7 && todayCheckIn.sleepHours <= 9 ? 3 : todayCheckIn.sleepHours >= 6 ? 1 : 0;
    const sleepQualityBonus = todayCheckIn.sleepQuality >= 7 ? 2 : todayCheckIn.sleepQuality >= 5 ? 1 : 0;
    recoveryBonus = {
      available: true,
      points: sleepHoursBonus + sleepQualityBonus,
      max: 5,
      detail: `${todayCheckIn.sleepHours}h sleep and ${todayCheckIn.sleepQuality}/10 sleep quality from today's check-in.`
    };
  } else if (data.fitnessProfile) {
    const points = data.fitnessProfile.recoveryQuality >= 8 ? 4 : data.fitnessProfile.recoveryQuality >= 6 ? 2 : 0;
    recoveryBonus = {
      available: true,
      points,
      max: 5,
      detail: `${data.fitnessProfile.recoveryQuality}/10 recovery quality from your fitness profile.`
    };
  }

  const availableCategories = categories.filter((category) => category.available);
  const availablePoints = sum(availableCategories.map((category) => category.points));
  const availableMax = sum(availableCategories.map((category) => category.max));
  const normalizedBase = availableMax ? (availablePoints / availableMax) * 95 : 0;
  const score = boundedScore(normalizedBase + recoveryBonus.points);
  const label = dailyScoreLabel(score, availableCategories.length);
  const improvement =
    categories.find((category) => category.available && category.points / category.max < 0.8) ??
    categories.find((category) => !category.available) ??
    categories[0];
  const missingCount = categories.filter((category) => !category.available).length;
  const strongCount = availableCategories.filter((category) => category.points / category.max >= 0.8).length;

  return {
    score,
    label: label.label,
    tone: label.tone,
    explanation: availableCategories.length
      ? `${strongCount} of ${availableCategories.length} scored areas are on track${missingCount ? `; ${missingCount} area${missingCount === 1 ? "" : "s"} need initial data.` : "."} ${recoveryBonus.available ? `Recovery support adds ${recoveryBonus.points} bonus point${recoveryBonus.points === 1 ? "" : "s"}.` : "No recovery bonus is available yet."}`
      : "Start tracking one or two core areas to generate a more meaningful daily score.",
    suggestion: improvement ? improvement.action : "Add today's first log",
    suggestionHref: improvement ? improvement.href : "/check-in",
    trend: "Trend placeholder: historical Daily Score storage is not enabled yet.",
    categories,
    recoveryBonus
  };
}

function buildRecommendedActions(data: SelfOsData, today: string): DashboardItem[] {
  const todayMeals = data.meals.filter((meal) => meal.date === today);
  const todayCheckIn = data.checkIns.find((entry) => entry.date === today);
  const moodLogged = data.moodLogs.some((entry) => entry.date === today) || Boolean(todayCheckIn);
  const workoutLogged = data.workoutLogs.some((log) => log.date === today);
  const todayJournal = data.journalEntries.some((entry) => entry.date === today && entry.completed);
  const habitsDue = data.habits.filter((habit) => !habit.completedToday);
  const goals = activeGoals(data.goals);
  const weeklyReviewDone =
    data.weeklyReviews.some((review) => isWithinDays(review.createdAt || review.weekStart, 7)) ||
    data.journalEntries.some((entry) => entry.mode.toLowerCase().includes("weekly") && isWithinDays(entry.date, 7));
  const plannedWorkout = plannedWorkoutForToday(data.activeWorkoutPlan);
  const recoveryLow = Boolean(todayCheckIn && (todayCheckIn.sleepHours < 6 || todayCheckIn.energyScore <= 4 || todayCheckIn.stressScore >= 8));
  const actions: DashboardItem[] = [];

  if (recoveryLow) {
    actions.push({
      title: "Recovery is low; bias lighter today",
      detail: "Keep activity lower fatigue and protect sleep, hydration, and joint comfort.",
      href: "/fitness",
      cta: "Adjust training",
      tone: "amber"
    });
  }

  if (!todayCheckIn) {
    actions.push({
      title: "Complete your daily check-in",
      detail: "Log mood, energy, stress, sleep, water, and productivity in one pass.",
      href: "/check-in",
      cta: "Check in",
      tone: "blue"
    });
  } else if (!moodLogged) {
    actions.push({
      title: "Add a quick mood note",
      detail: "A short mood log gives your analytics more signal over time.",
      href: "/mood",
      cta: "Add mood",
      tone: "blue"
    });
  }

  if (plannedWorkout && !workoutLogged) {
    actions.push({
      title: plannedWorkout.scheduled ? `Start ${plannedWorkout.name}` : "Start your next planned workout",
      detail: `${plannedWorkout.exerciseCount} exercises queued for ${plannedWorkout.focusMuscles.slice(0, 3).join(", ")}.`,
      href: "/fitness",
      cta: "Start workout",
      tone: recoveryLow ? "amber" : "green"
    });
  }

  if (!todayMeals.length) {
    actions.push({
      title: "Log your first meal today",
      detail: "Start with breakfast or the first thing you ate. Estimates are fine.",
      href: "/nutrition",
      cta: "Log meal",
      tone: "blue"
    });
  }

  if (habitsDue.length) {
    actions.push({
      title: `Finish ${habitsDue.length} remaining habit${habitsDue.length === 1 ? "" : "s"}`,
      detail: habitsDue.slice(0, 3).map((habit) => habit.name).join(", "),
      href: "/habits",
      cta: "Check habits",
      tone: "green"
    });
  }

  if (!todayJournal) {
    actions.push({
      title: "Capture a short reflection",
      detail: "One useful sentence is enough to keep the journal loop alive.",
      href: "/journal",
      cta: "Reflect",
      tone: "blue"
    });
  }

  if (goals[0]) {
    actions.push({
      title: `Update ${goals[0].title}`,
      detail: `${goals[0].progressPercentage}% complete. Move one task or add a progress note.`,
      href: "/goals",
      cta: "Update goal",
      tone: goals[0].priority === "High" ? "amber" : "blue"
    });
  }

  if (!weeklyReviewDone) {
    actions.push({
      title: "Complete a weekly review",
      detail: "Turn this week into one clear adjustment for next week.",
      href: "/review",
      cta: "Review week",
      tone: "default"
    });
  }

  return actions.slice(0, 5);
}

function buildTopPriorities(actions: DashboardItem[], habitsDue: HabitView[], goals: GoalView[]) {
  const items: TopPriority[] = [];
  const highPriorityGoal = goals.find((goal) => goal.priority === "High") ?? goals[0];
  const importantHabit = habitsDue.sort((a, b) => a.weeklyCompletion - b.weeklyCompletion)[0];

  if (highPriorityGoal) {
    items.push({
      title: highPriorityGoal.title,
      detail: `${highPriorityGoal.priority} priority goal at ${highPriorityGoal.progressPercentage}% progress.`,
      href: "/goals"
    });
  }

  if (importantHabit) {
    items.push({
      title: importantHabit.name,
      detail: `Incomplete today. Weekly consistency is ${percent(importantHabit.weeklyCompletion)}.`,
      href: "/habits"
    });
  }

  for (const action of actions) {
    if (items.some((item) => item.title === action.title)) continue;
    items.push({ title: action.title, detail: action.detail, href: action.href });
    if (items.length === 3) break;
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

  if (habitsDue.length) insights.push(`You have ${habitsDue.length} habit${habitsDue.length === 1 ? "" : "s"} still open today.`);
  if (!moodLogged) insights.push("Mood check-in is still pending.");
  if (goals.length) insights.push(`${goals.length} active goal${goals.length === 1 ? " needs" : "s need"} progress attention.`);
  if (!workoutLogged) insights.push(data.activeWorkoutPlan ? "Your active workout plan is ready when recovery supports it." : "No workout is logged for today.");
  if (!mealsToday.length) insights.push("No meals logged yet today. Start with the first meal you remember.");
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
      title: "Daily check-in",
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

function StatusPill({ children, tone = "default" }: { children: ReactNode; tone?: DashboardTone }) {
  const tones = {
    default: "border-line bg-surface text-muted",
    green: "border-evergreen/25 bg-evergreen/10 text-evergreen",
    blue: "border-mineral/25 bg-mineral/10 text-mineral",
    amber: "border-gold/25 bg-gold/10 text-gold",
    red: "border-ember/25 bg-ember/10 text-ember"
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function actionToneClass(tone: DashboardTone = "blue") {
  const tones = {
    default: "border-line bg-surface",
    blue: "border-mineral/30 bg-mineral/10",
    green: "border-evergreen/30 bg-evergreen/10",
    amber: "border-gold/30 bg-gold/10",
    red: "border-ember/30 bg-ember/10"
  };
  return tones[tone];
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

function MetricLink({
  href,
  label,
  value,
  detail,
  tone = "default",
  status
}: {
  href: string;
  label: string;
  value: string | number;
  detail?: string;
  tone?: DashboardTone;
  status?: string;
}) {
  const tones = {
    default: "border-line bg-panel",
    green: "border-evergreen/30 bg-evergreen/10",
    blue: "border-mineral/30 bg-mineral/10",
    amber: "border-gold/30 bg-gold/10",
    red: "border-ember/30 bg-ember/10"
  };

  return (
    <Link href={href} className={`focus-ring group rounded-lg border p-4 transition-colors hover:border-mineral/50 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
        <ArrowRight size={15} className="mt-0.5 text-muted transition-colors group-hover:text-ink" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
      {status ? <StatusPill tone={tone}>{status}</StatusPill> : null}
    </Link>
  );
}

function StatusCardLink({
  href,
  icon,
  title,
  children
}: {
  href: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="focus-ring group rounded-lg border border-line bg-panel p-4 transition-colors hover:border-mineral/50 hover:bg-surface">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-ink">
          {icon}
          {title}
        </div>
        <ArrowRight size={15} className="text-muted transition-colors group-hover:text-ink" />
      </div>
      {children}
    </Link>
  );
}

function DailyScoreCard({ dailyScore }: { dailyScore: DailyScoreResult }) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title="Daily Score" subtitle="A rule-based view of today's logged momentum." />
        <StatusPill tone={dailyScore.tone}>{dailyScore.label}</StatusPill>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-5xl font-semibold tracking-normal text-ink">{dailyScore.score}</p>
        <p className="pb-2 text-sm font-semibold text-muted">/100</p>
      </div>
      <div className="mt-4">
        <ProgressBar value={dailyScore.score} label={dailyScore.trend} />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{dailyScore.explanation}</p>

      <div className="mt-5 space-y-3">
        {dailyScore.categories.map((category) => (
          <Link key={category.label} href={category.href} className="focus-ring block rounded-lg border border-line bg-surface p-3 transition-colors hover:border-mineral/40">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">{category.label}</p>
              <StatusPill tone={category.tone}>{category.available ? `${category.points}/${category.max}` : "Not enough data"}</StatusPill>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{category.detail}</p>
            {category.available ? <div className="mt-2"><ProgressBar value={(category.points / category.max) * 100} /></div> : null}
          </Link>
        ))}
        <div className="rounded-lg border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Sleep / recovery support</p>
            <StatusPill tone={dailyScore.recoveryBonus.points ? "green" : "default"}>
              {dailyScore.recoveryBonus.available ? `+${dailyScore.recoveryBonus.points}/${dailyScore.recoveryBonus.max}` : "Not enough data"}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">{dailyScore.recoveryBonus.detail}</p>
        </div>
      </div>

      <Link
        href={dailyScore.suggestionHref}
        className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90"
      >
        {dailyScore.suggestion}
        <ArrowRight size={16} />
      </Link>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const today = todayIso();
  const dailyScore = buildDailyScore(data, today);
  const streakAchievementSummary = buildStreakAchievementSummary(data);
  const todayMeals = data.meals.filter((meal) => meal.date === today);
  const todayCheckIn = data.checkIns.find((entry) => entry.date === today);
  const todayJournal = data.journalEntries.some((entry) => entry.date === today && entry.completed);
  const nutrition = {
    calories: sum(todayMeals.map((meal) => meal.calories)),
    protein: sum(todayMeals.map((meal) => meal.protein)),
    carbs: sum(todayMeals.map((meal) => meal.carbs)),
    water: sum(todayMeals.map((meal) => meal.waterLiters ?? 0))
  };
  const habitsDone = data.habits.filter((habit) => habit.completedToday).length;
  const habitsDue = data.habits.filter((habit) => !habit.completedToday);
  const goals = activeGoals(data.goals);
  const goalAverage = average(goals.map((goal) => goal.progressPercentage));
  const moodLogged = data.moodLogs.some((entry) => entry.date === today) || Boolean(todayCheckIn);
  const workoutLogged = data.workoutLogs.some((log) => log.date === today);
  const plannedWorkout = plannedWorkoutForToday(data.activeWorkoutPlan);
  const recommendedActions = buildRecommendedActions(data, today);
  const topPriorities = buildTopPriorities(recommendedActions, habitsDue, goals);
  const insights = buildInsights(data, today);
  const recentActivity = buildRecentActivity(data);
  const learningMinutes = sum(data.learningItems.map((item) => item.studyMinutes));
  const expenses = sum(data.financeTransactions.filter((tx) => tx.type !== "income").map((tx) => tx.amount));
  const income = sum(data.financeTransactions.filter((tx) => tx.type === "income").map((tx) => tx.amount));
  const weeklyConsistency = average(data.habits.map((habit) => habit.weeklyCompletion));
  const recoveryLow = Boolean(todayCheckIn && (todayCheckIn.sleepHours < 6 || todayCheckIn.energyScore <= 4 || todayCheckIn.stressScore >= 8));
  const openCoreActions = [todayMeals.length === 0, !todayCheckIn, habitsDue.length > 0, plannedWorkout && !workoutLogged].filter(Boolean).length;
  const momentum = momentumLabel(dailyScore.score, recoveryLow, openCoreActions);

  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Today Dashboard"
        description="A focused operating view for what needs attention, what is already handled, and the next useful action."
        action={
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-2 text-sm font-semibold text-ink">
            <Flame size={16} className={recoveryLow ? "text-gold" : "text-evergreen"} />
            {momentum}
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <SectionTitle title="Recommended Next Actions" subtitle="SelfOS is prioritizing what would move today forward." />
          {recommendedActions.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {recommendedActions.map((action) => (
                <Link key={action.title} href={action.href} className={`focus-ring group rounded-lg border p-3 transition-colors hover:border-mineral/50 ${actionToneClass(action.tone)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ink">{action.title}</p>
                    <ArrowRight size={15} className="mt-1 shrink-0 text-muted transition-colors group-hover:text-ink" />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted">{action.detail}</p>
                  <StatusPill tone={action.tone}>{action.cta}</StatusPill>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="You are clear for now" body="Core logs and habits are handled. Use the extra space for a focused goal or recovery." />
          )}
        </Card>

        <Card>
          <SectionTitle title="Top Priorities" subtitle="Three focus items for the rest of today." />
          {topPriorities.length ? (
            <div className="space-y-3">
              {topPriorities.map((item, index) => (
                <Link key={`${item.title}-${index}`} href={item.href} className="focus-ring group flex gap-3 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-mineral/50">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-blue-600 text-sm font-bold text-white ring-1 ring-blue-400/40">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{item.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted">{item.detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No urgent priorities" body="Create a goal, habit, or daily check-in to give SelfOS something to prioritize." />
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <DailyScoreCard dailyScore={dailyScore} />
        <div className="grid gap-4 md:grid-cols-2">
          <MetricLink href="/fitness" label="Workout" value={workoutLogged ? "Logged" : "Open"} detail={data.activeWorkoutPlan?.name ?? "Fitness tracker"} tone={workoutLogged ? "green" : "blue"} />
          <MetricLink href="/nutrition" label="Nutrition" value={todayMeals.length ? `${todayMeals.length} meals` : "No meals"} detail={todayMeals.length ? `${nutrition.protein}g protein, ${nutrition.carbs}g carbs` : "No meals logged yet today. Start by logging breakfast."} tone={todayMeals.length ? "green" : "amber"} />
          <MetricLink href="/habits" label="Habits" value={`${habitsDone}/${data.habits.length}`} detail={habitsDue.length ? `${habitsDue.length} still open` : "All habits complete"} tone={habitsDue.length ? "amber" : "green"} />
          <MetricLink href="/check-in" label="Mood" value={moodLogged ? "Checked in" : "Pending"} detail={moodLogged ? "Today's mood is logged" : "Mood check-in still pending."} tone={moodLogged ? "green" : "amber"} />
          <MetricLink href="/habits" label="Weekly Consistency" value={percent(weeklyConsistency)} detail="Habit average" tone="blue" status={momentum} />
          <MetricLink href="/goals" label="Goal Progress" value={goalAverage ? percent(goalAverage) : "No active goals"} detail="Active goal average" tone={goalAverage ? "blue" : "default"} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <CurrentStreaksWidget streaks={streakAchievementSummary.streaks} />
        <RecentAchievementsWidget
          achievements={streakAchievementSummary.recentAchievements}
          nextAchievements={streakAchievementSummary.nextAchievements}
          momentumIndicators={streakAchievementSummary.momentumIndicators}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle title="Today's Status" subtitle="Every card opens the module where the action is completed." />
          <div className="grid gap-4 md:grid-cols-2">
            <StatusCardLink href="/fitness" title="Planned Workout" icon={<Dumbbell size={18} className="text-evergreen" />}>
              {plannedWorkout ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ink">{plannedWorkout.name}</span>
                    <span className="text-muted">{plannedWorkout.exerciseCount} exercises</span>
                  </div>
                  <p className="text-muted">{workoutLogged ? "Workout is logged for today." : `Ready for ${plannedWorkout.focusMuscles.slice(0, 3).join(", ")}`}</p>
                </div>
              ) : (
                <EmptyState title="No active workout plan yet" body="Generate a program on the Fitness page to make this card actionable." />
              )}
            </StatusCardLink>

            <StatusCardLink href="/habits" title="Habits" icon={<CheckCircle2 size={18} className="text-evergreen" />}>
              <div className="space-y-3">
                {data.habits.length ? data.habits.slice(0, 5).map((habit) => (
                  <div key={habit.id}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="truncate">{habit.name}</span>
                      <span className={habit.completedToday ? "text-evergreen" : "text-muted"}>
                        {habit.completedToday ? "Done" : "Still open"}
                      </span>
                    </div>
                    <ProgressBar value={habit.weeklyCompletion} />
                  </div>
                )) : <EmptyState title="No habits yet" body="Add one small habit today to start measuring consistency." />}
              </div>
            </StatusCardLink>

            <StatusCardLink href="/nutrition" title="Nutrition and Hydration" icon={<Salad size={18} className="text-mineral" />}>
              {todayMeals.length ? (
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted">Meals</dt><dd className="font-semibold">{todayMeals.length}</dd></div>
                  <div><dt className="text-muted">Protein</dt><dd className="font-semibold">{nutrition.protein}g</dd></div>
                  <div><dt className="text-muted">Carbs</dt><dd className="font-semibold">{nutrition.carbs}g</dd></div>
                  <div><dt className="text-muted">Water</dt><dd className="font-semibold">{Math.max(nutrition.water, todayCheckIn?.waterIntakeLiters ?? 0).toFixed(1)}L</dd></div>
                </dl>
              ) : (
                <EmptyState title="No meals logged yet today" body="Start by logging breakfast or your first meal." />
              )}
            </StatusCardLink>

            <StatusCardLink href="/check-in" title="Mood Check-In" icon={<Brain size={18} className="text-mineral" />}>
              {todayCheckIn ? (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted">Mood</dt><dd className="font-semibold">{todayCheckIn.moodScore}/10</dd></div>
                  <div><dt className="text-muted">Energy</dt><dd className="font-semibold">{todayCheckIn.energyScore}/10</dd></div>
                  <div><dt className="text-muted">Stress</dt><dd className="font-semibold">{todayCheckIn.stressScore}/10</dd></div>
                  <div><dt className="text-muted">Sleep</dt><dd className="font-semibold">{todayCheckIn.sleepHours}h</dd></div>
                </dl>
              ) : (
                <EmptyState title="Mood check-in still pending" body="A one-minute check-in will improve your daily score and analytics." />
              )}
            </StatusCardLink>

            <StatusCardLink href="/goals" title="Reflection and Progress" icon={<NotebookPen size={18} className="text-evergreen" />}>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted">Journal</dt><dd className="font-semibold">{todayJournal ? "Complete" : "Reflection pending"}</dd></div>
                <div><dt className="text-muted">Goals</dt><dd className="font-semibold">{goalAverage ? percent(goalAverage) : "No active"}</dd></div>
                <div><dt className="text-muted">Learning</dt><dd className="font-semibold">{learningMinutes} min</dd></div>
                <div><dt className="text-muted">Finance</dt><dd className="font-semibold">{currency(income - expenses)}</dd></div>
              </dl>
            </StatusCardLink>

            <StatusCardLink href="/finance" title="Finance Snapshot" icon={<WalletCards size={18} className="text-gold" />}>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted">Income</dt><dd className="font-semibold">{currency(income)}</dd></div>
                <div><dt className="text-muted">Outflow</dt><dd className="font-semibold">{currency(expenses)}</dd></div>
                <div><dt className="text-muted">Net</dt><dd className="font-semibold">{currency(income - expenses)}</dd></div>
                <div><dt className="text-muted">Review</dt><dd className="font-semibold">Open</dd></div>
              </dl>
            </StatusCardLink>
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
            <SectionTitle title="Quick Actions" subtitle="Jump straight into the module that needs the next update." />
            <Link href="/analytics" className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-zinc-800/80">
              View analytics
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <QuickAction href="/nutrition" label="Log meal" detail="Add food, macros, and notes." icon={Utensils} />
            <QuickAction href="/fitness" label="Start workout" detail="Open the active plan or workout log." icon={Dumbbell} />
            <QuickAction href="/habits" label="Check habits" detail="Review today's completions." icon={CheckCircle2} />
            <QuickAction href="/mood" label="Add mood entry" detail="Capture mood, stress, and energy." icon={Brain} />
            <QuickAction href="/goals" label="Update goal progress" detail="Move an active priority forward." icon={Goal} />
            <QuickAction href="/review" label="Review week" detail="Summarize wins, patterns, and next focus." icon={CalendarCheck2} />
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <SectionTitle title="Recent Activity" subtitle="Latest logs and updates from your connected modules." />
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
            This dashboard is a read-only operating layer. It summarizes existing SelfOS data and routes you to the module where each action should be completed.
          </p>
        </div>
      </div>
    </>
  );
}
