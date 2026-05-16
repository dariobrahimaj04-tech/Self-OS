import {
  checkIns,
  financeTransactions,
  goals,
  habits,
  journalEntries,
  learningItems,
  meals,
  moodLogs,
  performancePoints
} from "./mock-data";
import type {
  DailyCheckInView,
  FinanceTransactionView,
  GoalView,
  HabitView,
  JournalEntryView,
  LearningItemView,
  MealView,
  MoodLogView,
  WorkoutPerformancePoint
} from "./types";
import { average, sum } from "./utils";

type AnalyticsInput = {
  checkIns?: DailyCheckInView[];
  financeTransactions?: FinanceTransactionView[];
  goals?: GoalView[];
  habits?: HabitView[];
  journalEntries?: JournalEntryView[];
  learningItems?: LearningItemView[];
  meals?: MealView[];
  moodLogs?: MoodLogView[];
  performancePoints?: WorkoutPerformancePoint[];
};

const defaults = {
  checkIns,
  financeTransactions,
  goals,
  habits,
  journalEntries,
  learningItems,
  meals,
  moodLogs,
  performancePoints
};

function withDefaults(input: AnalyticsInput = {}) {
  return {
    checkIns: input.checkIns ?? defaults.checkIns,
    financeTransactions: input.financeTransactions ?? defaults.financeTransactions,
    goals: input.goals ?? defaults.goals,
    habits: input.habits ?? defaults.habits,
    journalEntries: input.journalEntries ?? defaults.journalEntries,
    learningItems: input.learningItems ?? defaults.learningItems,
    meals: input.meals ?? defaults.meals,
    moodLogs: input.moodLogs ?? defaults.moodLogs,
    performancePoints: input.performancePoints ?? defaults.performancePoints
  };
}

export function correlation(points: Array<[number, number]>) {
  if (points.length < 2) return 0;
  const xMean = average(points.map(([x]) => x));
  const yMean = average(points.map(([, y]) => y));
  const numerator = points.reduce((total, [x, y]) => total + (x - xMean) * (y - yMean), 0);
  const xDenominator = Math.sqrt(points.reduce((total, [x]) => total + (x - xMean) ** 2, 0));
  const yDenominator = Math.sqrt(points.reduce((total, [, y]) => total + (y - yMean) ** 2, 0));
  if (!xDenominator || !yDenominator) return 0;
  return numerator / (xDenominator * yDenominator);
}

function describeCorrelation(value: number) {
  const magnitude = Math.abs(value);
  if (magnitude >= 0.7) return "strong";
  if (magnitude >= 0.4) return "moderate";
  if (magnitude >= 0.2) return "small";
  return "weak";
}

export function analyticsSeries(input: AnalyticsInput = {}) {
  const data = withDefaults(input);
  const sleepVsMood = data.checkIns.map((entry) => ({
    date: entry.date,
    sleep: entry.sleepHours,
    mood: entry.moodScore,
    stress: entry.stressScore,
    productivity: entry.productivityScore,
    journaled: data.journalEntries.some((journal) => journal.date === entry.date)
  }));

  const workoutConsistency = data.performancePoints.map((point) => ({
    date: point.date,
    trained: point.trained ? 1 : 0,
    performance: point.performance,
    protein: point.protein,
    sleep: point.sleepHours,
    stress: point.stress
  }));

  const spendingByCategory = Object.values(
    data.financeTransactions.reduce<Record<string, { category: string; amount: number }>>((acc, tx) => {
      if (tx.type === "income") return acc;
      acc[tx.category] ??= { category: tx.category, amount: 0 };
      acc[tx.category].amount += tx.amount;
      return acc;
    }, {})
  );

  return {
    sleepVsMood,
    workoutConsistency,
    habits: data.habits.map((habit) => ({ name: habit.name, weekly: habit.weeklyCompletion, monthly: habit.monthlyCompletion })),
    learning: data.learningItems.map((item) => ({ name: item.category, minutes: item.studyMinutes, confidence: item.confidenceScore })),
    goalProgress: data.goals.map((goal) => ({ name: goal.category, progress: goal.progressPercentage })),
    spendingByCategory,
    moodLogs: data.moodLogs
  };
}

export function patternInsights(input: AnalyticsInput = {}) {
  const data = withDefaults(input);
  const sleepMood = correlation(data.checkIns.map((entry) => [entry.sleepHours, entry.moodScore]));
  const workoutMood = correlation(data.performancePoints.map((point, index) => [point.trained ? 1 : 0, data.checkIns[index]?.moodScore ?? 5]));
  const proteinPerformance = correlation(data.performancePoints.map((point) => [point.protein, point.performance]));
  const journalingStress = correlation(
    data.checkIns.map((entry) => [data.journalEntries.some((journal) => journal.date === entry.date) ? 1 : 0, 11 - entry.stressScore])
  );
  const studyProductivity = correlation(
    data.checkIns.map((entry, index) => [data.learningItems[index % Math.max(data.learningItems.length, 1)]?.studyMinutes ?? 0, entry.productivityScore])
  );
  const spendingStress = correlation(data.checkIns.map((entry) => {
    const spending = sum(data.financeTransactions.filter((tx) => tx.date === entry.date && tx.type !== "income").map((tx) => tx.amount));
    return [spending, entry.stressScore];
  }));

  return [
    {
      title: "Sleep and mood",
      body: `Sleep has a ${describeCorrelation(sleepMood)} relationship with mood in the current data. Mood is usually higher when sleep reaches 7+ hours.`,
      value: sleepMood
    },
    {
      title: "Workout and mood",
      body: `Training days show a ${describeCorrelation(workoutMood)} mood signal. Keep the interpretation light until more logs accumulate.`,
      value: workoutMood
    },
    {
      title: "Protein and performance",
      body: `Protein intake has a ${describeCorrelation(proteinPerformance)} relationship with workout performance. Consistent meals appear to support better sessions.`,
      value: proteinPerformance
    },
    {
      title: "Journaling and stress",
      body: `Journaling shows a ${describeCorrelation(journalingStress)} association with lower stress scores.`,
      value: journalingStress
    },
    {
      title: "Study time and productivity",
      body: `Study time and productivity currently show a ${describeCorrelation(studyProductivity)} relationship.`,
      value: studyProductivity
    },
    {
      title: "Spending and stress",
      body: `Spending has a ${describeCorrelation(spendingStress)} relationship with stress in this small sample.`,
      value: spendingStress
    }
  ];
}

export function nutritionSummary(inputMeals?: MealView[]) {
  const sourceMeals = inputMeals ?? meals;
  const today = sourceMeals.filter((meal) => meal.date === new Date().toISOString().slice(0, 10));
  const source = today.length ? today : sourceMeals.slice(0, 3);
  return {
    calories: sum(source.map((meal) => meal.calories)),
    protein: sum(source.map((meal) => meal.protein)),
    carbs: sum(source.map((meal) => meal.carbs)),
    fats: sum(source.map((meal) => meal.fats)),
    water: sum(source.map((meal) => meal.waterLiters ?? 0))
  };
}
