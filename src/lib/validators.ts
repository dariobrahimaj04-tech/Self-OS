import { z } from "zod";

const score = z.coerce.number().int().min(1).max(10);
const nonEmpty = z.string().trim().min(1);
const optionalText = z.string().trim().optional().or(z.literal(""));
const dateString = z.string().min(8);

export const dailyCheckInSchema = z.object({
  date: dateString,
  moodScore: score,
  energyScore: score,
  stressScore: score,
  sleepHours: z.coerce.number().min(0).max(24),
  sleepQuality: score,
  productivityScore: score,
  socialConnectionScore: score,
  waterIntakeLiters: z.coerce.number().min(0).max(12),
  notes: optionalText
});

export const mealSchema = z.object({
  date: dateString,
  mealType: nonEmpty,
  foodName: nonEmpty,
  calories: z.coerce.number().int().min(0).max(5000),
  protein: z.coerce.number().min(0).max(400),
  carbs: z.coerce.number().min(0).max(800),
  fats: z.coerce.number().min(0).max(300),
  waterLiters: z.coerce.number().min(0).max(8).optional(),
  notes: optionalText,
  energyImpact: optionalText,
  favorite: z.coerce.boolean().optional()
});

export const moodLogSchema = z.object({
  date: dateString,
  mood: score,
  energy: score,
  stress: score,
  sleepQuality: score,
  socialConnection: score,
  anxietyLevel: score,
  productivity: score,
  notes: optionalText
});

export const journalSchema = z.object({
  date: dateString,
  mode: nonEmpty,
  title: nonEmpty,
  content: z.string().trim().min(3),
  completed: z.coerce.boolean().optional()
});

export const habitSchema = z.object({
  name: nonEmpty,
  category: nonEmpty,
  frequency: nonEmpty,
  targetDays: z.array(z.string()).default([]),
  notes: optionalText
});

export const goalSchema = z.object({
  title: nonEmpty,
  category: nonEmpty,
  description: optionalText,
  startDate: dateString,
  targetDate: dateString.optional(),
  priority: nonEmpty,
  status: nonEmpty,
  progressPercentage: z.coerce.number().int().min(0).max(100),
  weeklyReviewNotes: optionalText
});

export const learningItemSchema = z.object({
  name: nonEmpty,
  category: nonEmpty,
  currentLevel: nonEmpty,
  targetLevel: nonEmpty,
  studyMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  resourceLink: optionalText,
  notes: optionalText,
  confidenceScore: score,
  relatedProjects: z.array(z.string()).default([]),
  completionPercentage: z.coerce.number().int().min(0).max(100)
});

export const financeTransactionSchema = z.object({
  type: z.enum(["income", "expense", "debt", "subscription"]),
  amount: z.coerce.number().min(0),
  category: nonEmpty,
  date: dateString,
  notes: optionalText
});

export const workoutLogSchema = z.object({
  date: dateString,
  title: nonEmpty,
  durationMinutes: z.coerce.number().int().min(0).max(360).optional(),
  sessionDifficulty: score.optional(),
  performanceTrend: z.enum(["improved", "stable", "dropped"]).optional(),
  notes: optionalText
});

export const schemas = {
  dailyCheckIns: dailyCheckInSchema,
  meals: mealSchema,
  moodLogs: moodLogSchema,
  journalEntries: journalSchema,
  habits: habitSchema,
  goals: goalSchema,
  learningItems: learningItemSchema,
  financeTransactions: financeTransactionSchema,
  workoutLogs: workoutLogSchema
};

export type CrudResource = keyof typeof schemas;
