import "server-only";

import { databaseConfigured, getPrisma } from "@/lib/prisma";
import type {
  DailyCheckInView,
  FinanceTransactionView,
  FitnessProfileInput,
  GoalView,
  HabitView,
  InsightView,
  JournalEntryView,
  LearningItemView,
  MealView,
  MoodLogView,
  WorkoutLogView,
  WorkoutPerformancePoint
} from "@/lib/types";

export type SelfOsData = {
  checkIns: DailyCheckInView[];
  meals: MealView[];
  moodLogs: MoodLogView[];
  journalEntries: JournalEntryView[];
  habits: HabitView[];
  goals: GoalView[];
  learningItems: LearningItemView[];
  financeTransactions: FinanceTransactionView[];
  workoutLogs: WorkoutLogView[];
  insights: InsightView[];
  performancePoints: WorkoutPerformancePoint[];
  fitnessProfile: FitnessProfileInput | null;
};

export const emptySelfOsData: SelfOsData = {
  checkIns: [],
  meals: [],
  moodLogs: [],
  journalEntries: [],
  habits: [],
  goals: [],
  learningItems: [],
  financeTransactions: [],
  workoutLogs: [],
  insights: [],
  performancePoints: [],
  fitnessProfile: null
};

const isoDate = (value: Date | string) => new Date(value).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

function completionPercentage(logs: Array<{ date: Date; completed: boolean }>, days: number) {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const relevant = logs.filter((log) => log.date >= start);
  return Math.round((relevant.filter((log) => log.completed).length / days) * 100);
}

function streak(logs: Array<{ date: Date; completed: boolean }>) {
  const completed = new Set(logs.filter((log) => log.completed).map((log) => isoDate(log.date)));
  let count = 0;
  const cursor = new Date();

  while (completed.has(isoDate(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}

function buildPerformancePoints(
  checkIns: DailyCheckInView[],
  meals: MealView[],
  workoutLogs: WorkoutLogView[]
): WorkoutPerformancePoint[] {
  return checkIns.map((entry) => {
    const dayMeals = meals.filter((meal) => meal.date === entry.date);
    const workout = workoutLogs.find((log) => log.date === entry.date);
    return {
      date: entry.date,
      performance: workout?.sessionDifficulty ?? entry.productivityScore,
      stress: entry.stressScore,
      sleepHours: entry.sleepHours,
      protein: dayMeals.reduce((total, meal) => total + meal.protein, 0),
      trained: Boolean(workout)
    };
  });
}

export async function getSelfOsData(userId: string): Promise<SelfOsData> {
  if (!databaseConfigured()) return emptySelfOsData;

  const prisma = getPrisma();
  const [
    checkIns,
    meals,
    moodLogs,
    journalEntries,
    habits,
    goals,
    learningItems,
    financeTransactions,
    workoutLogs,
    insights,
    fitnessProfile
  ] = await Promise.all([
    prisma.dailyCheckIn.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 90 }),
    prisma.meal.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 200 }),
    prisma.moodLog.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 120 }),
    prisma.journalEntry.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
    prisma.habit.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: "desc" },
      include: { logs: { orderBy: { date: "desc" }, take: 60 } }
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { milestones: true, tasks: true }
    }),
    prisma.learningItem.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.financeTransaction.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 200 }),
    prisma.workoutLog.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 120 }),
    prisma.insight.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.fitnessProfile.findUnique({ where: { userId } })
  ]);

  const mappedCheckIns: DailyCheckInView[] = checkIns.map((entry) => ({
    date: isoDate(entry.date),
    moodScore: entry.moodScore,
    energyScore: entry.energyScore,
    stressScore: entry.stressScore,
    sleepHours: entry.sleepHours,
    sleepQuality: entry.sleepQuality,
    productivityScore: entry.productivityScore,
    socialConnectionScore: entry.socialConnectionScore,
    waterIntakeLiters: entry.waterIntakeLiters,
    notes: entry.notes ?? undefined
  }));

  const mappedMeals: MealView[] = meals.map((meal) => ({
    id: meal.id,
    date: isoDate(meal.date),
    mealType: meal.mealType,
    foodName: meal.foodName,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats,
    waterLiters: meal.waterLiters ?? undefined,
    notes: meal.notes ?? undefined,
    energyImpact: meal.energyImpact ?? undefined,
    favorite: meal.favorite
  }));

  const mappedMoodLogs: MoodLogView[] = moodLogs.map((entry) => ({
    id: entry.id,
    date: isoDate(entry.date),
    mood: entry.mood,
    energy: entry.energy,
    stress: entry.stress,
    sleepQuality: entry.sleepQuality,
    socialConnection: entry.socialConnection,
    anxietyLevel: entry.anxietyLevel,
    productivity: entry.productivity,
    notes: entry.notes ?? undefined
  }));

  const mappedJournalEntries: JournalEntryView[] = journalEntries.map((entry) => ({
    id: entry.id,
    date: isoDate(entry.date),
    mode: entry.mode,
    title: entry.title,
    content: entry.content,
    completed: entry.completed
  }));

  const todayIso = today();
  const mappedHabits: HabitView[] = habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    category: habit.category,
    frequency: habit.frequency,
    targetDays: habit.targetDays,
    notes: habit.notes ?? undefined,
    streak: streak(habit.logs),
    weeklyCompletion: completionPercentage(habit.logs, 7),
    monthlyCompletion: completionPercentage(habit.logs, 30),
    completedToday: habit.logs.some((log) => isoDate(log.date) === todayIso && log.completed)
  }));

  const mappedGoals: GoalView[] = goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    category: goal.category,
    description: goal.description ?? "",
    startDate: isoDate(goal.startDate),
    targetDate: goal.targetDate ? isoDate(goal.targetDate) : "",
    priority: goal.priority,
    status: goal.status,
    progressPercentage: goal.progressPercentage,
    milestones: goal.milestones.map((milestone) => milestone.title),
    tasks: goal.tasks.map((task) => task.title),
    weeklyReviewNotes: goal.weeklyReviewNotes ?? undefined
  }));

  const mappedLearningItems: LearningItemView[] = learningItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    currentLevel: item.currentLevel,
    targetLevel: item.targetLevel,
    studyMinutes: item.studyMinutes,
    resourceLink: item.resourceLink ?? undefined,
    notes: item.notes ?? undefined,
    confidenceScore: item.confidenceScore,
    relatedProjects: item.relatedProjects,
    completionPercentage: item.completionPercentage
  }));

  const mappedFinanceTransactions: FinanceTransactionView[] = financeTransactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type as FinanceTransactionView["type"],
    amount: transaction.amount,
    category: transaction.category,
    date: isoDate(transaction.date),
    notes: transaction.notes ?? undefined
  }));

  const mappedWorkoutLogs: WorkoutLogView[] = workoutLogs.map((log) => ({
    id: log.id,
    date: isoDate(log.date),
    title: log.title,
    durationMinutes: log.durationMinutes ?? 0,
    sessionDifficulty: log.sessionDifficulty ?? 5,
    performanceTrend: (log.performanceTrend ?? "stable") as WorkoutLogView["performanceTrend"],
    notes: log.notes ?? undefined
  }));

  const mappedInsights: InsightView[] = insights.map((insight) => ({
    id: insight.id,
    category: insight.category,
    title: insight.title,
    body: insight.body,
    confidence: insight.confidence
  }));

  const mappedFitnessProfile: FitnessProfileInput | null = fitnessProfile
    ? {
        age: fitnessProfile.age,
        heightCm: fitnessProfile.heightCm,
        weightKg: fitnessProfile.weightKg,
        trainingExperience: fitnessProfile.trainingExperience as FitnessProfileInput["trainingExperience"],
        primaryGoal: fitnessProfile.primaryGoal as FitnessProfileInput["primaryGoal"],
        secondaryGoal: fitnessProfile.secondaryGoal ?? undefined,
        daysAvailablePerWeek: fitnessProfile.daysAvailablePerWeek,
        preferredWorkoutDuration: fitnessProfile.preferredWorkoutDuration,
        availableEquipment: fitnessProfile.availableEquipment,
        weakMuscleGroups: fitnessProfile.weakMuscleGroups,
        injuriesOrLimitations: fitnessProfile.injuriesOrLimitations ?? undefined,
        sleepAverage: fitnessProfile.sleepAverage,
        stressLevel: fitnessProfile.stressLevel,
        recoveryQuality: fitnessProfile.recoveryQuality,
        preferredSplit: fitnessProfile.preferredSplit as FitnessProfileInput["preferredSplit"],
        strengthNumbers: {
          benchPress: fitnessProfile.benchPressEstimate ?? 0,
          squat: fitnessProfile.squatEstimate ?? 0,
          deadlift: fitnessProfile.deadliftEstimate ?? 0,
          overheadPress: fitnessProfile.overheadPressEstimate ?? 0
        }
      }
    : null;

  return {
    checkIns: mappedCheckIns,
    meals: mappedMeals,
    moodLogs: mappedMoodLogs,
    journalEntries: mappedJournalEntries,
    habits: mappedHabits,
    goals: mappedGoals,
    learningItems: mappedLearningItems,
    financeTransactions: mappedFinanceTransactions,
    workoutLogs: mappedWorkoutLogs,
    insights: mappedInsights,
    performancePoints: buildPerformancePoints(mappedCheckIns, mappedMeals, mappedWorkoutLogs),
    fitnessProfile: mappedFitnessProfile
  };
}
