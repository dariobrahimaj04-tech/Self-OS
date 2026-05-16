import { checkIns, financeTransactions, habits, learningItems, performancePoints } from "./mock-data";
import { nutritionSummary } from "./analytics";
import type {
  DailyCheckInView,
  FinanceTransactionView,
  HabitView,
  LearningItemView,
  MealView,
  WorkoutPerformancePoint
} from "./types";
import { average, currency, sum } from "./utils";

export type CoachMode =
  | "Fitness coach"
  | "Nutrition coach"
  | "Productivity coach"
  | "Mood reflection coach"
  | "Study coach"
  | "Finance coach"
  | "Weekly review coach";

export const coachModes: CoachMode[] = [
  "Fitness coach",
  "Nutrition coach",
  "Productivity coach",
  "Mood reflection coach",
  "Study coach",
  "Finance coach",
  "Weekly review coach"
];

export type CoachInput = {
  checkIns?: DailyCheckInView[];
  financeTransactions?: FinanceTransactionView[];
  habits?: HabitView[];
  learningItems?: LearningItemView[];
  meals?: MealView[];
  performancePoints?: WorkoutPerformancePoint[];
};

export function coachFeedback(mode: CoachMode, input: CoachInput = {}) {
  const data = {
    checkIns: input.checkIns ?? checkIns,
    financeTransactions: input.financeTransactions ?? financeTransactions,
    habits: input.habits ?? habits,
    learningItems: input.learningItems ?? learningItems,
    meals: input.meals,
    performancePoints: input.performancePoints ?? performancePoints
  };
  const latest = data.checkIns[0];
  const nutrition = nutritionSummary(data.meals);
  const weeklySpending = sum(data.financeTransactions.filter((tx) => tx.type !== "income").map((tx) => tx.amount));
  const trainedDays = data.performancePoints.filter((point) => point.trained).length;
  const averageMood = average(data.checkIns.map((entry) => entry.moodScore));

  if (!latest) {
    return [
      "No personal logs are available yet.",
      "Start with one check-in and one small record in the area you want to understand.",
      "SelfOS will generate better feedback as your private data builds up."
    ];
  }

  const feedback: Record<CoachMode, string[]> = {
    "Fitness coach": [
      `${trainedDays} training days are logged in the current week sample.`,
      latest.stressScore >= 7
        ? "Stress is elevated, so keep RIR conservative and avoid adding volume this week."
        : "Recovery markers support maintaining the plan and progressing reps before load.",
      "Any joint pain should trigger an exercise substitution or volume reduction."
    ],
    "Nutrition coach": [
      `Current logged intake is ${nutrition.calories} calories and ${nutrition.protein}g protein.`,
      nutrition.protein >= 130
        ? "Protein consistency looks supportive for training."
        : "A simple protein anchor at breakfast or lunch would likely help consistency.",
      "Keep changes moderate and health-focused; avoid extreme restriction."
    ],
    "Productivity coach": [
      `Latest productivity score is ${latest.productivityScore}/10.`,
      data.habits.find((habit) => habit.name === "Study block")?.completedToday
        ? "The study block is already handled today."
        : "A short study block would be the highest-leverage unfinished habit.",
      "Protect the first focused work block before opening low-priority inputs."
    ],
    "Mood reflection coach": [
      `Average mood across the sample is ${averageMood.toFixed(1)}/10.`,
      latest.sleepHours >= 7
        ? "Sleep is supporting mood today."
        : "Mood may benefit from a lower-friction evening shutdown routine.",
      "Use journaling as reflection, not self-criticism."
    ],
    "Study coach": [
      `Tracked study time across active items is ${sum(data.learningItems.map((item) => item.studyMinutes))} minutes.`,
      "SQL and Power BI have the clearest project connection right now.",
      "End each study session with one artifact: a query, chart, note, or commit."
    ],
    "Finance coach": [
      `Tracked non-income spending in this sample is ${currency(weeklySpending)}.`,
      "Subscriptions are visible, which makes the monthly review easier.",
      "Use spending reviews to find patterns, not to create shame."
    ],
    "Weekly review coach": [
      "Best signal: sleep, protein, and journaling cluster with better mood and productivity.",
      "Main constraint: high-stress days reduce training output and consistency.",
      "Next week focus: protect sleep, keep protein anchors, and log workout feedback."
    ]
  };

  return feedback[mode];
}
