import type { SelfOsData } from "@/lib/selfos-data";
import { buildStreakAchievementSummary, type StreakAchievementSummary } from "@/lib/streaks-achievements";
import type { GoalView, HabitView } from "@/lib/types";
import { average, currency, percent, sum } from "@/lib/utils";

export type ReviewTone = "default" | "green" | "blue" | "amber" | "red";

export type WeeklyReviewItem = {
  title: string;
  detail: string;
  href?: string;
  tone?: ReviewTone;
};

export type WeeklyReviewMetric = {
  label: string;
  value: string;
  detail: string;
  tone: ReviewTone;
  progress?: number;
};

export type WeeklyReviewSummary = {
  weekRange: string;
  previousWeekRange: string;
  generatedAt: string;
  momentumLabel: string;
  momentumTone: ReviewTone;
  momentumDetail: string;
  hasComparison: boolean;
  overview: WeeklyReviewMetric[];
  wins: WeeklyReviewItem[];
  challenges: WeeklyReviewItem[];
  focus: WeeklyReviewItem[];
  trends: WeeklyReviewItem[];
  patterns: WeeklyReviewItem[];
  activitySummary: WeeklyReviewItem[];
  streakChanges: WeeklyReviewItem[];
  achievementsUnlocked: WeeklyReviewItem[];
  consistencySummary: WeeklyReviewItem[];
  streakAchievementSummary: StreakAchievementSummary;
  current: WeeklyPeriodSummary;
  previous: WeeklyPeriodSummary;
};

export type WeeklyPeriodSummary = {
  dates: string[];
  averageDailyScore: number;
  workoutsCompleted: number;
  workoutTarget: number;
  habitCompletion: number;
  habitDataAvailable: boolean;
  nutritionDays: number;
  nutritionConsistency: number;
  mealsLogged: number;
  moodDays: number;
  moodConsistency: number;
  averageMood: number;
  averageStress: number;
  averageSleep: number;
  journalEntries: number;
  weeklyReviewCompleted: boolean;
  goalProgress: number;
  activeGoalCount: number;
  highPriorityGoalCount: number;
  learningMinutesTracked: number;
  financeSpend: number;
  activityCount: number;
  hasRawData: boolean;
};

function localNoon(value: Date | string) {
  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  return date;
}

function isoDate(value: Date) {
  const date = localNoon(value);
  return date.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const date = localNoon(value);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfWeek(value: Date) {
  const date = localNoon(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function minDate(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b;
}

function dateRange(start: Date, end: Date) {
  const dates: string[] = [];
  for (let cursor = localNoon(start); cursor <= localNoon(end); cursor = addDays(cursor, 1)) {
    dates.push(isoDate(cursor));
  }
  return dates;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(localNoon(value));
}

function formatRange(start: Date, end: Date) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function boundedScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueDates(values: string[]) {
  return new Set(values).size;
}

function activeGoals(goals: GoalView[]) {
  return goals.filter((goal) => goal.status.toLowerCase() !== "completed" && goal.progressPercentage < 100);
}

function goalPriorityScore(goal: GoalView) {
  if (goal.priority.toLowerCase() === "high") return 3;
  if (goal.priority.toLowerCase() === "medium") return 2;
  return 1;
}

function toneForScore(score: number): ReviewTone {
  if (score >= 80) return "green";
  if (score >= 65) return "blue";
  if (score >= 45) return "amber";
  return "red";
}

function toneForDelta(delta: number): ReviewTone {
  if (delta >= 6) return "green";
  if (delta <= -6) return "amber";
  return "blue";
}

function habitCompletedOnDate(data: SelfOsData, habit: HabitView, date: string, today: string) {
  const log = data.habitLogs.find((entry) => entry.habitId === habit.id && entry.date === date);
  if (log) return log.completed;
  if (date === today) return habit.completedToday;
  return false;
}

function habitCompletionForDate(data: SelfOsData, date: string, today: string) {
  if (!data.habits.length) return 0;
  return average(data.habits.map((habit) => (habitCompletedOnDate(data, habit, date, today) ? 100 : 0)));
}

function habitCompletionForRange(data: SelfOsData, habit: HabitView, dates: string[], fallbackToCurrentWeek: boolean) {
  if (!dates.length) return null;
  const dateSet = new Set(dates);
  const matchingLogs = data.habitLogs.filter((log) => log.habitId === habit.id && dateSet.has(log.date));

  if (matchingLogs.length) {
    return (matchingLogs.filter((log) => log.completed).length / dates.length) * 100;
  }

  return fallbackToCurrentWeek ? habit.weeklyCompletion : null;
}

function calculateDailyScore(data: SelfOsData, date: string, today: string) {
  const mealsToday = data.meals.filter((meal) => meal.date === date);
  const checkIn = data.checkIns.find((entry) => entry.date === date);
  const moodLogged = data.moodLogs.some((entry) => entry.date === date) || Boolean(checkIn);
  const workoutLogged = data.workoutLogs.some((log) => log.date === date);
  const goals = activeGoals(data.goals);
  const categories: Array<{ points: number; max: number; available: boolean }> = [];

  if (data.habits.length) {
    categories.push({
      points: Math.round((habitCompletionForDate(data, date, today) / 100) * 25),
      max: 25,
      available: true
    });
  } else {
    categories.push({ points: 0, max: 25, available: false });
  }

  if (workoutLogged || data.activeWorkoutPlan || data.workoutLogs.length) {
    categories.push({
      points: workoutLogged ? 20 : data.activeWorkoutPlan ? 8 : 6,
      max: 20,
      available: true
    });
  } else {
    categories.push({ points: 0, max: 20, available: false });
  }

  if (data.meals.length) {
    categories.push({
      points: mealsToday.length >= 3 ? 20 : mealsToday.length === 2 ? 17 : mealsToday.length === 1 ? 12 : 5,
      max: 20,
      available: true
    });
  } else {
    categories.push({ points: 0, max: 20, available: false });
  }

  if (data.moodLogs.length || data.checkIns.length) {
    categories.push({ points: moodLogged ? 15 : 5, max: 15, available: true });
  } else {
    categories.push({ points: 0, max: 15, available: false });
  }

  if (data.goals.length) {
    const hasProgressSignal = goals.some((goal) => goal.progressPercentage > 0 || Boolean(goal.weeklyReviewNotes));
    const avgProgress = average(goals.map((goal) => goal.progressPercentage));
    categories.push({
      points: goals.length ? Math.min(15, hasProgressSignal ? Math.max(8, Math.round(6 + avgProgress * 0.09)) : 5) : 15,
      max: 15,
      available: true
    });
  } else {
    categories.push({ points: 0, max: 15, available: false });
  }

  let recoveryBonus = 0;
  if (checkIn) {
    const sleepHoursBonus = checkIn.sleepHours >= 7 && checkIn.sleepHours <= 9 ? 3 : checkIn.sleepHours >= 6 ? 1 : 0;
    const sleepQualityBonus = checkIn.sleepQuality >= 7 ? 2 : checkIn.sleepQuality >= 5 ? 1 : 0;
    recoveryBonus = sleepHoursBonus + sleepQualityBonus;
  } else if (data.fitnessProfile) {
    recoveryBonus = data.fitnessProfile.recoveryQuality >= 8 ? 4 : data.fitnessProfile.recoveryQuality >= 6 ? 2 : 0;
  }

  const available = categories.filter((category) => category.available);
  const availablePoints = sum(available.map((category) => category.points));
  const availableMax = sum(available.map((category) => category.max));
  return boundedScore(availableMax ? (availablePoints / availableMax) * 95 + recoveryBonus : 0);
}

function buildPeriodSummary(data: SelfOsData, dates: string[], today: string, fallbackCurrentHabits: boolean): WeeklyPeriodSummary {
  const dateSet = new Set(dates);
  const meals = data.meals.filter((meal) => dateSet.has(meal.date));
  const workoutLogs = data.workoutLogs.filter((log) => dateSet.has(log.date));
  const checkIns = data.checkIns.filter((entry) => dateSet.has(entry.date));
  const moodLogs = data.moodLogs.filter((entry) => dateSet.has(entry.date));
  const journalEntries = data.journalEntries.filter((entry) => dateSet.has(entry.date));
  const weeklyReviews = data.weeklyReviews.filter((review) => dateSet.has(review.createdAt) || dateSet.has(review.weekStart));
  const financeTransactions = data.financeTransactions.filter((tx) => dateSet.has(tx.date));
  const goalSet = activeGoals(data.goals);
  const habitValues = data.habits
    .map((habit) => habitCompletionForRange(data, habit, dates, fallbackCurrentHabits))
    .filter((value): value is number => typeof value === "number");
  const moodValues = checkIns.length ? checkIns.map((entry) => entry.moodScore) : moodLogs.map((entry) => entry.mood);
  const stressValues = checkIns.length ? checkIns.map((entry) => entry.stressScore) : moodLogs.map((entry) => entry.stress);
  const dailyScores = dates.map((date) => calculateDailyScore(data, date, today));
  const rawActivityCount = meals.length + workoutLogs.length + checkIns.length + moodLogs.length + journalEntries.length + weeklyReviews.length + financeTransactions.length;

  return {
    dates,
    averageDailyScore: average(dailyScores),
    workoutsCompleted: workoutLogs.length,
    workoutTarget: Math.min(Math.max(data.fitnessProfile?.daysAvailablePerWeek ?? 3, 1), dates.length || 1),
    habitCompletion: habitValues.length ? average(habitValues) : 0,
    habitDataAvailable: Boolean(habitValues.length),
    nutritionDays: uniqueDates(meals.map((meal) => meal.date)),
    nutritionConsistency: dates.length ? (uniqueDates(meals.map((meal) => meal.date)) / dates.length) * 100 : 0,
    mealsLogged: meals.length,
    moodDays: uniqueDates([...checkIns.map((entry) => entry.date), ...moodLogs.map((entry) => entry.date)]),
    moodConsistency: dates.length ? (uniqueDates([...checkIns.map((entry) => entry.date), ...moodLogs.map((entry) => entry.date)]) / dates.length) * 100 : 0,
    averageMood: average(moodValues),
    averageStress: average(stressValues),
    averageSleep: average(checkIns.map((entry) => entry.sleepHours)),
    journalEntries: journalEntries.length,
    weeklyReviewCompleted: weeklyReviews.length > 0 || journalEntries.some((entry) => entry.mode.toLowerCase().includes("weekly") && entry.completed),
    goalProgress: average(goalSet.map((goal) => goal.progressPercentage)),
    activeGoalCount: goalSet.length,
    highPriorityGoalCount: goalSet.filter((goal) => goalPriorityScore(goal) >= 3).length,
    learningMinutesTracked: sum(data.learningItems.map((item) => item.studyMinutes)),
    financeSpend: sum(financeTransactions.filter((tx) => tx.type !== "income").map((tx) => tx.amount)),
    activityCount: rawActivityCount + (habitValues.length ? data.habits.length : 0),
    hasRawData: Boolean(rawActivityCount || habitValues.length)
  };
}

function buildTrends(current: WeeklyPeriodSummary, previous: WeeklyPeriodSummary): WeeklyReviewItem[] {
  if (!previous.hasRawData) {
    return [
      {
        title: "Trend comparison needs more history",
        detail: "SelfOS will compare this week against last week once previous-week logs are available.",
        tone: "default"
      }
    ];
  }

  const scoreDelta = current.averageDailyScore - previous.averageDailyScore;
  const workoutDelta = current.workoutsCompleted - previous.workoutsCompleted;
  const nutritionDelta = current.nutritionDays - previous.nutritionDays;
  const trends: WeeklyReviewItem[] = [
    {
      title: scoreDelta >= 5 ? "Daily Score improved" : scoreDelta <= -5 ? "Daily Score dipped" : "Daily Score stayed steady",
      detail: `${Math.round(current.averageDailyScore)}/100 this week vs ${Math.round(previous.averageDailyScore)}/100 last week.`,
      tone: toneForDelta(scoreDelta)
    },
    {
      title: workoutDelta > 0 ? "Workout completion improved" : workoutDelta < 0 ? "Workout completion slowed" : "Workout completion held steady",
      detail: `${current.workoutsCompleted} workout${current.workoutsCompleted === 1 ? "" : "s"} this week vs ${previous.workoutsCompleted} last week.`,
      tone: workoutDelta > 0 ? "green" : workoutDelta < 0 ? "amber" : "blue"
    },
    {
      title: nutritionDelta > 0 ? "Meal logging became more consistent" : nutritionDelta < 0 ? "Meal logging was less consistent" : "Meal logging was similar",
      detail: `${current.nutritionDays} nutrition day${current.nutritionDays === 1 ? "" : "s"} this week vs ${previous.nutritionDays} last week.`,
      tone: nutritionDelta > 0 ? "green" : nutritionDelta < 0 ? "amber" : "blue"
    }
  ];

  if (previous.habitDataAvailable && current.habitDataAvailable) {
    const habitDelta = current.habitCompletion - previous.habitCompletion;
    trends.push({
      title: habitDelta >= 5 ? "Habit consistency improved" : habitDelta <= -5 ? "Habit consistency dropped" : "Habit consistency stayed close",
      detail: `${percent(current.habitCompletion)} this week vs ${percent(previous.habitCompletion)} last week.`,
      tone: toneForDelta(habitDelta)
    });
  }

  if (previous.averageMood && current.averageMood) {
    const moodDelta = current.averageMood - previous.averageMood;
    trends.push({
      title: moodDelta >= 0.5 ? "Mood trended up" : moodDelta <= -0.5 ? "Mood trended down" : "Mood was stable",
      detail: `${current.averageMood.toFixed(1)}/10 average mood this week vs ${previous.averageMood.toFixed(1)}/10 last week.`,
      tone: toneForDelta(moodDelta * 10)
    });
  }

  return trends.slice(0, 5);
}

function buildWins(current: WeeklyPeriodSummary, previous: WeeklyPeriodSummary): WeeklyReviewItem[] {
  const wins: WeeklyReviewItem[] = [];

  if (current.workoutsCompleted >= current.workoutTarget) {
    wins.push({
      title: `Completed ${current.workoutsCompleted} workouts`,
      detail: "Training volume matched or beat the current weekly target.",
      href: "/fitness",
      tone: "green"
    });
  } else if (current.workoutsCompleted > 0) {
    wins.push({
      title: `Logged ${current.workoutsCompleted} workout${current.workoutsCompleted === 1 ? "" : "s"}`,
      detail: "Fitness data is coming in, which makes weekly adjustment more useful.",
      href: "/fitness",
      tone: "blue"
    });
  }

  if (current.nutritionConsistency >= 70) {
    wins.push({
      title: `Logged nutrition on ${current.nutritionDays} days`,
      detail: "Meal data was consistent enough to support better pattern finding.",
      href: "/nutrition",
      tone: "green"
    });
  }

  if (current.habitDataAvailable && current.habitCompletion >= 75) {
    wins.push({
      title: "Maintained strong habit consistency",
      detail: `${percent(current.habitCompletion)} completion across tracked habits.`,
      href: "/habits",
      tone: "green"
    });
  }

  if (current.activeGoalCount && current.goalProgress >= 50) {
    wins.push({
      title: "Progressed active goals",
      detail: `Active goals average ${percent(current.goalProgress)} progress.`,
      href: "/goals",
      tone: "blue"
    });
  }

  if (previous.hasRawData && current.averageDailyScore - previous.averageDailyScore >= 5) {
    wins.push({
      title: "Improved Daily Score consistency",
      detail: `Weekly average rose by ${Math.round(current.averageDailyScore - previous.averageDailyScore)} points.`,
      href: "/",
      tone: "green"
    });
  }

  if (current.moodConsistency >= 70) {
    wins.push({
      title: "Kept mood data visible",
      detail: `Mood or check-in data exists on ${current.moodDays} day${current.moodDays === 1 ? "" : "s"}.`,
      href: "/mood",
      tone: "blue"
    });
  }

  return wins.length ? wins.slice(0, 5) : [
    {
      title: "Built the feedback loop",
      detail: "Even a small amount of tracking this week gives SelfOS something to learn from next week.",
      href: "/",
      tone: "blue"
    }
  ];
}

function buildChallenges(current: WeeklyPeriodSummary): WeeklyReviewItem[] {
  const challenges: WeeklyReviewItem[] = [];

  if (current.workoutsCompleted < Math.max(1, Math.floor(current.workoutTarget * 0.6))) {
    challenges.push({
      title: "Workout completion needs attention",
      detail: `${current.workoutsCompleted} of ${current.workoutTarget} target workouts are logged so far.`,
      href: "/fitness",
      tone: "amber"
    });
  }

  if (current.nutritionConsistency < 50) {
    challenges.push({
      title: "Nutrition logging was inconsistent",
      detail: `Meals were logged on ${current.nutritionDays} of ${current.dates.length} reviewed days.`,
      href: "/nutrition",
      tone: "amber"
    });
  }

  if (current.habitDataAvailable && current.habitCompletion < 60) {
    challenges.push({
      title: "Habit consistency dipped",
      detail: `${percent(current.habitCompletion)} completion suggests a smaller set of habits may work better next week.`,
      href: "/habits",
      tone: "amber"
    });
  }

  if (current.moodConsistency < 50) {
    challenges.push({
      title: "Mood check-ins were sparse",
      detail: "More check-ins would make mood, stress, and sleep patterns easier to spot.",
      href: "/check-in",
      tone: "amber"
    });
  }

  if (current.averageSleep > 0 && current.averageSleep < 6.5) {
    challenges.push({
      title: "Sleep average looks low",
      detail: `${current.averageSleep.toFixed(1)}h average sleep from check-ins. Treat this as a recovery signal, not a diagnosis.`,
      href: "/check-in",
      tone: "red"
    });
  }

  if (current.averageStress >= 7) {
    challenges.push({
      title: "Stress ran high",
      detail: `${current.averageStress.toFixed(1)}/10 average stress. Keep next week's plan realistic and recovery-aware.`,
      href: "/mood",
      tone: "amber"
    });
  }

  if (current.highPriorityGoalCount && current.goalProgress < 25) {
    challenges.push({
      title: "High-priority goals may be stalled",
      detail: "Progress is still early. Pick one visible next action instead of adding more priorities.",
      href: "/goals",
      tone: "amber"
    });
  }

  return challenges.length ? challenges.slice(0, 5) : [
    {
      title: "No major friction point surfaced",
      detail: "The week looks steady from the available data. Keep the next adjustment small and specific.",
      tone: "green"
    }
  ];
}

function buildFocus(current: WeeklyPeriodSummary, challenges: WeeklyReviewItem[]): WeeklyReviewItem[] {
  const focus: WeeklyReviewItem[] = [];
  const addFocus = (item: WeeklyReviewItem) => {
    if (!focus.some((existing) => existing.title === item.title)) focus.push(item);
  };

  if (!current.weeklyReviewCompleted) {
    addFocus({
      title: "Write one weekly reflection",
      detail: "Capture what improved, what got avoided, and the main focus for next week.",
      href: "/journal",
      tone: "blue"
    });
  }

  for (const challenge of challenges) {
    if (challenge.href === "/nutrition") {
      addFocus({
        title: "Log one meal per day first",
        detail: "Start with a simple breakfast or first-meal log before chasing perfect macros.",
        href: "/nutrition",
        tone: "blue"
      });
    } else if (challenge.href === "/fitness") {
      addFocus({
        title: "Schedule the next workout",
        detail: "Choose the next recoverable session and log it, even if volume is conservative.",
        href: "/fitness",
        tone: "green"
      });
    } else if (challenge.href === "/habits") {
      addFocus({
        title: "Reduce habit load",
        detail: "Pick the two habits that matter most and rebuild consistency around them.",
        href: "/habits",
        tone: "amber"
      });
    } else if (challenge.href === "/check-in" || challenge.href === "/mood") {
      addFocus({
        title: "Protect sleep and check-ins",
        detail: "A short daily check-in gives the next review better recovery and stress signal.",
        href: "/check-in",
        tone: "blue"
      });
    } else if (challenge.href === "/goals") {
      addFocus({
        title: "Choose one goal task",
        detail: "Move one high-priority goal with a concrete next task before adding anything new.",
        href: "/goals",
        tone: "amber"
      });
    }
  }

  if (current.activeGoalCount && focus.length < 3) {
    addFocus({
      title: "Update active goal progress",
      detail: "Leave a short progress note so next week's review can detect movement.",
      href: "/goals",
      tone: "blue"
    });
  }

  if (!focus.length) {
    addFocus({
      title: "Keep the plan stable",
      detail: "Repeat the behaviors that worked this week and adjust only one variable.",
      href: "/",
      tone: "green"
    });
  }

  return focus.slice(0, 3);
}

function buildPatterns(data: SelfOsData, current: WeeklyPeriodSummary): WeeklyReviewItem[] {
  const currentDateSet = new Set(current.dates);
  const currentCheckIns = data.checkIns.filter((entry) => currentDateSet.has(entry.date));
  const patterns: WeeklyReviewItem[] = [];

  if (currentCheckIns.length >= 3) {
    const restedMood = currentCheckIns.filter((entry) => entry.sleepHours >= 7).map((entry) => entry.moodScore);
    const shortSleepMood = currentCheckIns.filter((entry) => entry.sleepHours < 7).map((entry) => entry.moodScore);
    if (restedMood.length && shortSleepMood.length) {
      patterns.push({
        title: "Sleep and mood signal",
        detail: `Mood averaged ${average(restedMood).toFixed(1)}/10 on 7h+ sleep days vs ${average(shortSleepMood).toFixed(1)}/10 on shorter sleep days.`,
        href: "/analytics",
        tone: average(restedMood) >= average(shortSleepMood) ? "green" : "amber"
      });
    }

    const highStressDays = currentCheckIns.filter((entry) => entry.stressScore >= 7).length;
    if (highStressDays) {
      patterns.push({
        title: "Stress pattern",
        detail: `${highStressDays} high-stress day${highStressDays === 1 ? "" : "s"} appeared in this review window.`,
        href: "/mood",
        tone: highStressDays >= 3 ? "amber" : "blue"
      });
    }
  }

  if (current.nutritionDays && current.workoutsCompleted) {
    patterns.push({
      title: "Nutrition and training coverage",
      detail: `${current.nutritionDays} nutrition day${current.nutritionDays === 1 ? "" : "s"} and ${current.workoutsCompleted} workout${current.workoutsCompleted === 1 ? "" : "s"} are available for pattern finding.`,
      href: "/analytics",
      tone: "blue"
    });
  }

  if (current.habitDataAvailable) {
    patterns.push({
      title: "Habit trend",
      detail: `${percent(current.habitCompletion)} weekly habit completion is the main consistency signal right now.`,
      href: "/habits",
      tone: current.habitCompletion >= 70 ? "green" : "amber"
    });
  }

  return patterns.length ? patterns.slice(0, 4) : [
    {
      title: "Patterns are still forming",
      detail: "Add a few more check-ins, meals, workouts, or habit logs to make weekly patterns more reliable.",
      href: "/check-in",
      tone: "default"
    }
  ];
}

function buildActivitySummary(current: WeeklyPeriodSummary): WeeklyReviewItem[] {
  return [
    {
      title: "Fitness",
      detail: `${current.workoutsCompleted} workout${current.workoutsCompleted === 1 ? "" : "s"} logged against a ${current.workoutTarget}-workout target.`,
      href: "/fitness",
      tone: current.workoutsCompleted >= current.workoutTarget ? "green" : "blue"
    },
    {
      title: "Nutrition",
      detail: `${current.mealsLogged} meal${current.mealsLogged === 1 ? "" : "s"} across ${current.nutritionDays} day${current.nutritionDays === 1 ? "" : "s"}.`,
      href: "/nutrition",
      tone: current.nutritionConsistency >= 70 ? "green" : "amber"
    },
    {
      title: "Reflection",
      detail: `${current.journalEntries} journal entr${current.journalEntries === 1 ? "y" : "ies"}; weekly review is ${current.weeklyReviewCompleted ? "complete" : "still open"}.`,
      href: "/journal",
      tone: current.weeklyReviewCompleted ? "green" : "blue"
    },
    {
      title: "Finance",
      detail: `${currency(current.financeSpend)} in non-income transactions was tracked this week.`,
      href: "/finance",
      tone: current.financeSpend ? "blue" : "default"
    },
    {
      title: "Learning",
      detail: `${current.learningMinutesTracked} tracked study minutes are available from current learning items.`,
      href: "/learning",
      tone: current.learningMinutesTracked ? "blue" : "default"
    }
  ];
}

function buildStreakChanges(streakSummary: StreakAchievementSummary): WeeklyReviewItem[] {
  const active = streakSummary.streaks
    .filter((streak) => streak.current > 0)
    .sort((a, b) => b.current - a.current || b.longest - a.longest)
    .slice(0, 4)
    .map((streak) => ({
      title: `${streak.label} streak is active`,
      detail: `${streak.current} current ${streak.unit}${streak.current === 1 ? "" : "s"}; longest run is ${streak.longest}.`,
      href: streak.href,
      tone: streak.tone
    }));

  if (streakSummary.coreConsistencyStreak.current > 0) {
    active.unshift({
      title: "Core consistency is active",
      detail: streakSummary.consistencySummary,
      href: "/",
      tone: streakSummary.coreConsistencyStreak.tone
    });
  }

  return active.length ? active.slice(0, 4) : [
    {
      title: "No active streak yet",
      detail: "Start with one completed meal, check-in, workout, habit, or review to rebuild momentum.",
      href: "/",
      tone: "default"
    }
  ];
}

function buildAchievementUnlockItems(streakSummary: StreakAchievementSummary): WeeklyReviewItem[] {
  if (!streakSummary.thisWeekAchievements.length) {
    const next = streakSummary.nextAchievements[0];
    return [
      {
        title: next ? `Next milestone: ${next.title}` : "No new achievement this week",
        detail: next ? next.progress.label : "Current achievements are already unlocked from available history.",
        href: next?.href ?? "/",
        tone: next ? "blue" : "default"
      }
    ];
  }

  return streakSummary.thisWeekAchievements.slice(0, 4).map((achievement) => ({
    title: achievement.title,
    detail: `${achievement.description}${achievement.unlockedAt ? ` Unlocked ${achievement.unlockedAt}.` : ""}`,
    href: achievement.href,
    tone: achievement.tone
  }));
}

function buildConsistencySummary(streakSummary: StreakAchievementSummary): WeeklyReviewItem[] {
  const indicators = streakSummary.momentumIndicators.map((indicator) => ({
    title: indicator.title,
    detail: indicator.detail,
    href: "/review",
    tone: indicator.tone
  }));

  return [
    {
      title: "Consistency summary",
      detail: streakSummary.consistencySummary,
      href: "/",
      tone: streakSummary.coreConsistencyStreak.tone
    },
    ...indicators
  ].slice(0, 4);
}

function buildOverview(current: WeeklyPeriodSummary, previous: WeeklyPeriodSummary, hasComparison: boolean): WeeklyReviewMetric[] {
  const dailyDelta = current.averageDailyScore - previous.averageDailyScore;
  return [
    {
      label: "Weekly Avg Daily Score",
      value: `${Math.round(current.averageDailyScore)}/100`,
      detail: hasComparison ? `${dailyDelta >= 0 ? "+" : ""}${Math.round(dailyDelta)} vs last week` : "Comparison appears after more history",
      tone: toneForScore(current.averageDailyScore),
      progress: current.averageDailyScore
    },
    {
      label: "Workouts Completed",
      value: `${current.workoutsCompleted}/${current.workoutTarget}`,
      detail: "Logged training sessions this week",
      tone: current.workoutsCompleted >= current.workoutTarget ? "green" : current.workoutsCompleted ? "blue" : "amber",
      progress: current.workoutTarget ? (current.workoutsCompleted / current.workoutTarget) * 100 : 0
    },
    {
      label: "Habit Completion",
      value: current.habitDataAvailable ? percent(current.habitCompletion) : "No data",
      detail: current.habitDataAvailable ? "Average across tracked habits" : "Complete habits to activate this metric",
      tone: current.habitDataAvailable ? toneForScore(current.habitCompletion) : "default",
      progress: current.habitCompletion
    },
    {
      label: "Nutrition Consistency",
      value: percent(current.nutritionConsistency),
      detail: `${current.nutritionDays} of ${current.dates.length} reviewed days have meals`,
      tone: toneForScore(current.nutritionConsistency),
      progress: current.nutritionConsistency
    },
    {
      label: "Mood Coverage",
      value: percent(current.moodConsistency),
      detail: current.averageMood ? `${current.averageMood.toFixed(1)}/10 average mood` : "Add mood check-ins for patterns",
      tone: toneForScore(current.moodConsistency),
      progress: current.moodConsistency
    },
    {
      label: "Goal Progress",
      value: current.activeGoalCount ? percent(current.goalProgress) : "No active goals",
      detail: current.activeGoalCount ? `${current.activeGoalCount} active goal${current.activeGoalCount === 1 ? "" : "s"}` : "Create goals to review progress",
      tone: current.goalProgress >= 60 ? "green" : current.goalProgress ? "blue" : "default",
      progress: current.goalProgress
    }
  ];
}

function momentum(current: WeeklyPeriodSummary, previous: WeeklyPeriodSummary) {
  const delta = current.averageDailyScore - previous.averageDailyScore;
  const comparison = previous.hasRawData;

  if (current.averageDailyScore >= 85 && current.habitCompletion >= 80) {
    return {
      label: "Excellent Momentum",
      tone: "green" as const,
      detail: "Daily score, habits, and core tracking are all showing strong follow-through."
    };
  }

  if (current.averageSleep >= 7.25 && current.averageStress > 0 && current.averageStress <= 5 && current.averageDailyScore >= 60) {
    return {
      label: "Strong Recovery Week",
      tone: "green" as const,
      detail: "Sleep and stress signals look supportive. Keep next week's adjustments conservative and repeatable."
    };
  }

  if (current.averageDailyScore >= 70) {
    return {
      label: "Consistent Progress",
      tone: "blue" as const,
      detail: "The week has enough completed actions to keep momentum without adding more complexity."
    };
  }

  if (comparison && delta >= 5) {
    return {
      label: "Rebuilding Consistency",
      tone: "blue" as const,
      detail: "This week improved compared with last week. Keep the next step small and visible."
    };
  }

  if ((current.averageSleep > 0 && current.averageSleep < 6.5) || current.averageStress >= 7 || current.averageDailyScore < 45) {
    return {
      label: "Needs Reset",
      tone: "amber" as const,
      detail: "The useful move is a simpler week: fewer priorities, better recovery, and clear logging basics."
    };
  }

  return {
    label: "Rebuilding Consistency",
    tone: "blue" as const,
    detail: "There is enough signal to keep going. Choose one or two anchors for next week."
  };
}

export function buildWeeklyReview(data: SelfOsData, now = new Date()): WeeklyReviewSummary {
  const today = isoDate(localNoon(now));
  const currentStart = startOfWeek(now);
  const currentEnd = addDays(currentStart, 6);
  const currentThrough = minDate(localNoon(now), currentEnd);
  const currentDates = dateRange(currentStart, currentThrough);
  const previousStart = addDays(currentStart, -7);
  const previousEnd = addDays(previousStart, currentDates.length - 1);
  const previousDates = dateRange(previousStart, previousEnd);
  const current = buildPeriodSummary(data, currentDates, today, true);
  const previous = buildPeriodSummary(data, previousDates, today, false);
  const hasComparison = previous.hasRawData;
  const challenges = buildChallenges(current);
  const momentumResult = momentum(current, previous);
  const streakAchievementSummary = buildStreakAchievementSummary(data, now);

  return {
    weekRange: formatRange(currentStart, currentEnd),
    previousWeekRange: formatRange(previousStart, addDays(previousStart, 6)),
    generatedAt: formatDate(now),
    momentumLabel: momentumResult.label,
    momentumTone: momentumResult.tone,
    momentumDetail: momentumResult.detail,
    hasComparison,
    overview: buildOverview(current, previous, hasComparison),
    wins: buildWins(current, previous),
    challenges,
    focus: buildFocus(current, challenges),
    trends: buildTrends(current, previous),
    patterns: buildPatterns(data, current),
    activitySummary: buildActivitySummary(current),
    streakChanges: buildStreakChanges(streakAchievementSummary),
    achievementsUnlocked: buildAchievementUnlockItems(streakAchievementSummary),
    consistencySummary: buildConsistencySummary(streakAchievementSummary),
    streakAchievementSummary,
    current,
    previous
  };
}
