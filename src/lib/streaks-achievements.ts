import type { SelfOsData } from "@/lib/selfos-data";

export type StreakTone = "default" | "green" | "blue" | "amber" | "red";

export type StreakMetric = {
  id: string;
  label: string;
  description: string;
  current: number;
  longest: number;
  lastCompletedDate?: string;
  unit: "day" | "week";
  href: string;
  tone: StreakTone;
  historyAvailable: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  href: string;
  tone: StreakTone;
  progress: {
    current: number;
    target: number;
    label: string;
  };
};

export type MomentumIndicator = {
  title: string;
  detail: string;
  tone: StreakTone;
};

export type StreakAchievementSummary = {
  streaks: StreakMetric[];
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  recentAchievements: Achievement[];
  nextAchievements: Achievement[];
  thisWeekAchievements: Achievement[];
  momentumIndicators: MomentumIndicator[];
  consistencyDates: string[];
  coreConsistencyStreak: StreakMetric;
  consistencySummary: string;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localNoon(value: Date | string) {
  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  return date;
}

function isoDate(value: Date | string) {
  return localNoon(value).toISOString().slice(0, 10);
}

function addDays(value: Date | string, days: number) {
  const date = localNoon(value);
  date.setDate(date.getDate() + days);
  return date;
}

function dayDiff(a: string, b: string) {
  const from = localNoon(a).getTime();
  const to = localNoon(b).getTime();
  return Math.round((to - from) / 86_400_000);
}

function uniqueSorted(dates: Array<string | undefined>) {
  return [...new Set(dates.filter((date): date is string => Boolean(date)).map((date) => isoDate(date)))].sort();
}

function firstDate(dates: string[]) {
  return uniqueSorted(dates)[0];
}

function lastDate(dates: string[]) {
  const sorted = uniqueSorted(dates);
  return sorted[sorted.length - 1];
}

function startOfWeek(value: Date | string) {
  const date = localNoon(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return isoDate(addDays(date, diff));
}

function isWithinCurrentWeek(date: string | undefined, now: Date) {
  if (!date) return false;
  const weekStart = startOfWeek(now);
  const weekEnd = isoDate(addDays(weekStart, 6));
  return date >= weekStart && date <= weekEnd;
}

function formatCount(value: number, unit: "day" | "week") {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

function streakTone(current: number, longest: number): StreakTone {
  if (current >= 30 || longest >= 30) return "green";
  if (current >= 7 || longest >= 10) return "green";
  if (current >= 3 || longest >= 5) return "blue";
  if (current > 0) return "amber";
  return "default";
}

function dailyStreak(dates: string[], now: Date) {
  const sorted = uniqueSorted(dates);
  const set = new Set(sorted);
  const today = isoDate(now);
  const yesterday = isoDate(addDays(now, -1));
  const lastCompletedDate = sorted[sorted.length - 1];
  let longest = 0;
  let run = 0;
  let previous: string | undefined;

  for (const date of sorted) {
    run = previous && dayDiff(previous, date) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  const anchor = set.has(today) ? today : set.has(yesterday) ? yesterday : "";
  let current = 0;
  if (anchor) {
    for (let cursor = anchor; set.has(cursor); cursor = isoDate(addDays(cursor, -1))) {
      current += 1;
    }
  }

  return { current, longest, lastCompletedDate };
}

function weeklyStreak(dates: string[], now: Date) {
  const weeks = uniqueSorted(dates.map((date) => startOfWeek(date)));
  const set = new Set(weeks);
  const currentWeek = startOfWeek(now);
  const previousWeek = startOfWeek(addDays(currentWeek, -7));
  const lastCompletedDate = lastDate(dates);
  let longest = 0;
  let run = 0;
  let previous: string | undefined;

  for (const week of weeks) {
    run = previous && dayDiff(previous, week) === 7 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = week;
  }

  const anchor = set.has(currentWeek) ? currentWeek : set.has(previousWeek) ? previousWeek : "";
  let current = 0;
  if (anchor) {
    for (let cursor = anchor; set.has(cursor); cursor = startOfWeek(addDays(cursor, -7))) {
      current += 1;
    }
  }

  return { current, longest, lastCompletedDate };
}

function dateWhenDailyStreakReached(dates: string[], target: number) {
  const sorted = uniqueSorted(dates);
  let run = 0;
  let previous: string | undefined;

  for (const date of sorted) {
    run = previous && dayDiff(previous, date) === 1 ? run + 1 : 1;
    if (run >= target) return date;
    previous = date;
  }

  return undefined;
}

function dateAtCount(dates: string[], target: number) {
  const sorted = dates.map((date) => isoDate(date)).sort();
  return sorted.length >= target ? sorted[target - 1] : undefined;
}

function completionDateSet(dates: string[]) {
  return new Set(uniqueSorted(dates));
}

function weekdayLabel(date: string) {
  return DAY_NAMES[localNoon(date).getDay()];
}

function normalizeTargetDay(value: string) {
  return value.slice(0, 3).toLowerCase();
}

function habitDueOnDate(targetDays: string[], date: string) {
  if (!targetDays.length) return true;
  const day = weekdayLabel(date).toLowerCase();
  return targetDays.some((target) => normalizeTargetDay(target) === day);
}

function habitCompletionDates(data: SelfOsData, now: Date) {
  if (!data.habits.length) return [];
  const today = isoDate(now);
  const candidateDates = new Set(data.habitLogs.map((log) => log.date));
  if (data.habits.some((habit) => habit.completedToday)) candidateDates.add(today);

  const completedDates: string[] = [];
  for (const date of [...candidateDates].sort()) {
    const dueHabits = data.habits.filter((habit) => habitDueOnDate(habit.targetDays, date));
    if (!dueHabits.length) continue;
    const completed = dueHabits.filter((habit) => {
      const log = data.habitLogs.find((entry) => entry.habitId === habit.id && entry.date === date);
      if (log) return log.completed;
      return date === today && habit.completedToday;
    }).length;
    const completionRate = completed / dueHabits.length;
    if (completionRate >= 0.8) completedDates.push(date);
  }

  return uniqueSorted(completedDates);
}

function weeklyReviewDates(data: SelfOsData) {
  return uniqueSorted([
    ...data.weeklyReviews.map((review) => review.createdAt || review.weekStart),
    ...data.journalEntries
      .filter((entry) => entry.completed && entry.mode.toLowerCase().includes("weekly"))
      .map((entry) => entry.date)
  ]);
}

function goalProgressDates(data: SelfOsData) {
  return uniqueSorted(
    data.goals
      .filter((goal) => goal.progressPercentage > 0 || goal.status.toLowerCase() === "completed")
      .map((goal) => goal.updatedAt)
  );
}

function consistencyDates(data: SelfOsData, now: Date, habitDates: string[], reviewDates: string[]) {
  const workoutDates = completionDateSet(data.workoutLogs.map((log) => log.date));
  const nutritionDates = completionDateSet(data.meals.map((meal) => meal.date));
  const moodDates = completionDateSet([...data.checkIns.map((entry) => entry.date), ...data.moodLogs.map((entry) => entry.date)]);
  const journalDates = completionDateSet(data.journalEntries.filter((entry) => entry.completed).map((entry) => entry.date));
  const habitSet = completionDateSet(habitDates);
  const reviewSet = completionDateSet(reviewDates);
  const goalSet = completionDateSet(goalProgressDates(data));
  const candidates = new Set([
    ...workoutDates,
    ...nutritionDates,
    ...moodDates,
    ...journalDates,
    ...habitSet,
    ...reviewSet,
    ...goalSet,
    isoDate(now)
  ]);

  return uniqueSorted([...candidates].filter((date) => {
    const score = [
      workoutDates.has(date),
      nutritionDates.has(date),
      moodDates.has(date),
      journalDates.has(date) || reviewSet.has(date),
      habitSet.has(date),
      goalSet.has(date)
    ].filter(Boolean).length;
    return score >= 3;
  }));
}

function buildStreakMetric({
  id,
  label,
  description,
  dates,
  href,
  unit,
  now,
  historyAvailable
}: {
  id: string;
  label: string;
  description: string;
  dates: string[];
  href: string;
  unit: "day" | "week";
  now: Date;
  historyAvailable?: boolean;
}): StreakMetric {
  const stats = unit === "week" ? weeklyStreak(dates, now) : dailyStreak(dates, now);
  return {
    id,
    label,
    description,
    current: stats.current,
    longest: stats.longest,
    lastCompletedDate: stats.lastCompletedDate,
    unit,
    href,
    tone: streakTone(stats.current, stats.longest),
    historyAvailable: historyAvailable ?? dates.length > 0
  };
}

function achievement({
  id,
  title,
  description,
  unlocked,
  unlockedAt,
  current,
  target,
  label,
  href,
  tone = "blue"
}: {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  current: number;
  target: number;
  label: string;
  href: string;
  tone?: StreakTone;
}): Achievement {
  return {
    id,
    title,
    description,
    unlocked,
    unlockedAt,
    href,
    tone: unlocked ? tone : "default",
    progress: {
      current: Math.min(current, target),
      target,
      label
    }
  };
}

function buildMomentumIndicators(streaks: StreakMetric[], achievements: Achievement[], coreConsistencyStreak: StreakMetric): MomentumIndicator[] {
  const activeStreaks = streaks.filter((streak) => streak.current > 0);
  const recentAchievement = achievements.find((item) => item.unlocked && item.unlockedAt);
  const indicators: MomentumIndicator[] = [];

  if (coreConsistencyStreak.current >= 7) {
    indicators.push({
      title: "Strong consistency",
      detail: `${formatCount(coreConsistencyStreak.current, "day")} with multiple core logs active.`,
      tone: "green"
    });
  } else if (coreConsistencyStreak.current >= 3) {
    indicators.push({
      title: "Momentum building",
      detail: `${formatCount(coreConsistencyStreak.current, "day")} of broad consistency. Keep it simple.`,
      tone: "blue"
    });
  }

  if (activeStreaks.length >= 3) {
    indicators.push({
      title: "Multiple systems online",
      detail: `${activeStreaks.length} streaks are currently active across SelfOS.`,
      tone: "green"
    });
  }

  if (recentAchievement) {
    indicators.push({
      title: "Recent milestone",
      detail: `${recentAchievement.title} unlocked${recentAchievement.unlockedAt ? ` on ${recentAchievement.unlockedAt}` : ""}.`,
      tone: "blue"
    });
  }

  if (!indicators.length) {
    indicators.push({
      title: "Start the next streak",
      detail: "One workout, meal, check-in, habit, or review can restart momentum today.",
      tone: "default"
    });
  }

  return indicators.slice(0, 3);
}

export function buildStreakAchievementSummary(data: SelfOsData, now = new Date()): StreakAchievementSummary {
  const workoutDates = uniqueSorted(data.workoutLogs.map((log) => log.date));
  const nutritionDates = uniqueSorted(data.meals.map((meal) => meal.date));
  const moodDates = uniqueSorted([...data.checkIns.map((entry) => entry.date), ...data.moodLogs.map((entry) => entry.date)]);
  const habitDates = habitCompletionDates(data, now);
  const goalDates = goalProgressDates(data);
  const reviewDates = weeklyReviewDates(data);
  const consistency = consistencyDates(data, now, habitDates, reviewDates);
  const completedGoalDates = uniqueSorted(
    data.goals
      .filter((goal) => goal.status.toLowerCase() === "completed" || goal.progressPercentage >= 100)
      .map((goal) => goal.updatedAt || goal.targetDate || goal.startDate)
  );

  const streaks = [
    buildStreakMetric({
      id: "workout",
      label: "Workout logging",
      description: "Days with a workout log.",
      dates: workoutDates,
      href: "/fitness",
      unit: "day",
      now
    }),
    buildStreakMetric({
      id: "nutrition",
      label: "Nutrition logging",
      description: "Days with at least one meal logged.",
      dates: nutritionDates,
      href: "/nutrition",
      unit: "day",
      now
    }),
    buildStreakMetric({
      id: "habits",
      label: "Habit completion",
      description: "Days where due habits were mostly completed.",
      dates: habitDates,
      href: "/habits",
      unit: "day",
      now,
      historyAvailable: data.habits.length > 0
    }),
    buildStreakMetric({
      id: "mood",
      label: "Mood check-ins",
      description: "Days with mood or daily check-in data.",
      dates: moodDates,
      href: "/check-in",
      unit: "day",
      now
    }),
    buildStreakMetric({
      id: "goals",
      label: "Goal progress",
      description: "Days with goal progress updates when update dates are available.",
      dates: goalDates,
      href: "/goals",
      unit: "day",
      now,
      historyAvailable: goalDates.length > 0 || data.goals.some((goal) => goal.progressPercentage > 0)
    }),
    buildStreakMetric({
      id: "weekly-review",
      label: "Weekly review",
      description: "Consecutive weeks with a completed weekly review.",
      dates: reviewDates,
      href: "/review",
      unit: "week",
      now
    })
  ];
  const coreConsistencyStreak = buildStreakMetric({
    id: "core-consistency",
    label: "Core consistency",
    description: "Days with at least three SelfOS systems logged.",
    dates: consistency,
    href: "/",
    unit: "day",
    now
  });

  const achievements = [
    achievement({
      id: "first-workout",
      title: "First Workout Logged",
      description: "Logged the first workout in SelfOS.",
      unlocked: data.workoutLogs.length > 0,
      unlockedAt: firstDate(data.workoutLogs.map((log) => log.date)),
      current: data.workoutLogs.length,
      target: 1,
      label: `${data.workoutLogs.length} workout logs`,
      href: "/fitness",
      tone: "green"
    }),
    achievement({
      id: "first-meal",
      title: "First Meal Logged",
      description: "Started nutrition tracking with the first meal.",
      unlocked: data.meals.length > 0,
      unlockedAt: firstDate(data.meals.map((meal) => meal.date)),
      current: data.meals.length,
      target: 1,
      label: `${data.meals.length} meal logs`,
      href: "/nutrition",
      tone: "green"
    }),
    achievement({
      id: "first-mood",
      title: "First Mood Check-In",
      description: "Captured the first mood or daily check-in signal.",
      unlocked: moodDates.length > 0,
      unlockedAt: firstDate(moodDates),
      current: moodDates.length,
      target: 1,
      label: `${moodDates.length} mood days`,
      href: "/check-in",
      tone: "blue"
    }),
    achievement({
      id: "first-goal-completed",
      title: "First Goal Completed",
      description: "Closed the loop on a SelfOS goal.",
      unlocked: completedGoalDates.length > 0,
      unlockedAt: firstDate(completedGoalDates),
      current: completedGoalDates.length,
      target: 1,
      label: `${completedGoalDates.length} completed goals`,
      href: "/goals",
      tone: "green"
    }),
    achievement({
      id: "first-weekly-review",
      title: "First Weekly Review",
      description: "Completed the first weekly reflection loop.",
      unlocked: reviewDates.length > 0,
      unlockedAt: firstDate(reviewDates),
      current: reviewDates.length,
      target: 1,
      label: `${reviewDates.length} weekly reviews`,
      href: "/review",
      tone: "blue"
    }),
    achievement({
      id: "seven-day-habit-streak",
      title: "7-Day Habit Streak",
      description: "Held the habit system together for seven straight days.",
      unlocked: streaks.find((streak) => streak.id === "habits")?.longest ? (streaks.find((streak) => streak.id === "habits")?.longest ?? 0) >= 7 : false,
      unlockedAt: dateWhenDailyStreakReached(habitDates, 7),
      current: streaks.find((streak) => streak.id === "habits")?.longest ?? 0,
      target: 7,
      label: `${streaks.find((streak) => streak.id === "habits")?.longest ?? 0} best habit days`,
      href: "/habits",
      tone: "green"
    }),
    achievement({
      id: "ten-workouts",
      title: "10 Workouts Completed",
      description: "Built enough training history for useful performance patterns.",
      unlocked: data.workoutLogs.length >= 10,
      unlockedAt: dateAtCount(data.workoutLogs.map((log) => log.date), 10),
      current: data.workoutLogs.length,
      target: 10,
      label: `${data.workoutLogs.length} workout logs`,
      href: "/fitness",
      tone: "green"
    }),
    achievement({
      id: "thirty-meals",
      title: "30 Meals Logged",
      description: "Created enough nutrition history for consistency patterns.",
      unlocked: data.meals.length >= 30,
      unlockedAt: dateAtCount(data.meals.map((meal) => meal.date), 30),
      current: data.meals.length,
      target: 30,
      label: `${data.meals.length} meal logs`,
      href: "/nutrition",
      tone: "blue"
    }),
    achievement({
      id: "thirty-day-consistency",
      title: "30-Day Consistency Streak",
      description: "Kept multiple SelfOS systems active for a full month.",
      unlocked: coreConsistencyStreak.longest >= 30,
      unlockedAt: dateWhenDailyStreakReached(consistency, 30),
      current: coreConsistencyStreak.longest,
      target: 30,
      label: `${coreConsistencyStreak.longest} best consistency days`,
      href: "/review",
      tone: "green"
    })
  ];
  const unlockedAchievements = achievements.filter((item) => item.unlocked);
  const recentAchievements = [...unlockedAchievements]
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""))
    .slice(0, 5);
  const nextAchievements = achievements
    .filter((item) => !item.unlocked)
    .sort((a, b) => (b.progress.current / b.progress.target) - (a.progress.current / a.progress.target))
    .slice(0, 3);
  const thisWeekAchievements = unlockedAchievements.filter((item) => isWithinCurrentWeek(item.unlockedAt, now));
  const activeStreaks = streaks.filter((streak) => streak.current > 0).length;
  const bestCurrentStreak = Math.max(coreConsistencyStreak.current, ...streaks.map((streak) => streak.current));

  return {
    streaks,
    achievements,
    unlockedAchievements,
    recentAchievements,
    nextAchievements,
    thisWeekAchievements,
    momentumIndicators: buildMomentumIndicators(streaks, recentAchievements, coreConsistencyStreak),
    consistencyDates: consistency,
    coreConsistencyStreak,
    consistencySummary: activeStreaks
      ? `${activeStreaks} active streak${activeStreaks === 1 ? "" : "s"}; best current run is ${bestCurrentStreak} day${bestCurrentStreak === 1 ? "" : "s"} across tracked systems.`
      : "No active streaks yet. Start with one completed log today."
  };
}
