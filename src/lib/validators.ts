import { z } from "zod";

const score = z.coerce.number().int().min(1).max(10);
const nonEmpty = z.string().trim().min(1);
const optionalText = z.string().trim().optional().or(z.literal(""));
const dateString = z.string().min(8);
const stringList = z.array(z.string()).default([]);
const split = z.enum(["full body", "upper/lower", "push/pull/legs", "hybrid", "custom"]);
const progressionStyle = z.enum(["add reps first", "add load first", "double progression"]);

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

export const fitnessProfileSchema = z.object({
  age: z.coerce.number().int().min(13).max(100).optional(),
  heightCm: z.coerce.number().min(100).max(250).optional(),
  weightKg: z.coerce.number().min(30).max(300).optional(),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"]),
  monthsOrYearsTraining: optionalText,
  primaryGoal: z.enum(["hypertrophy", "strength", "recomposition", "general fitness"]),
  secondaryGoal: optionalText,
  daysAvailablePerWeek: z.coerce.number().int().min(2).max(6),
  preferredWorkoutDuration: z.coerce.number().int().min(30).max(150),
  availableEquipment: stringList,
  weakMuscleGroups: stringList,
  injuriesOrLimitations: optionalText,
  sleepAverage: z.coerce.number().min(0).max(12),
  stressLevel: score,
  recoveryQuality: score,
  preferredSplit: split,
  preferredExercises: stringList,
  favoriteExercises: stringList,
  blockedExercises: stringList,
  painfulExercises: stringList,
  allowAdvancedExercises: z.coerce.boolean().default(false),
  allowMyoReps: z.coerce.boolean().default(false),
  allowLengthenedPartials: z.coerce.boolean().default(false),
  allowBarbellCompounds: z.coerce.boolean().default(true),
  allowHighSpinalLoadingExercises: z.coerce.boolean().default(false),
  preferredProgressionStyle: progressionStyle.default("double progression"),
  strengthNumbers: z.record(z.coerce.number()).optional()
});

export const fitnessSettingsSchema = z.object({
  preferredSplit: split,
  trainingDays: z.coerce.number().int().min(2).max(6),
  mesocycleLength: z.coerce.number().int().min(3).max(8),
  defaultRirProgression: z.array(z.coerce.number().int().min(0).max(4)).min(3).max(8),
  defaultMinSets: z.coerce.number().int().min(1).max(4),
  defaultMaxSets: z.coerce.number().int().min(2).max(6),
  preferredExercises: stringList,
  favoriteExercises: stringList,
  blockedExercises: stringList,
  painfulExercises: stringList,
  allowAdvancedExercises: z.coerce.boolean().default(false),
  allowMyoReps: z.coerce.boolean().default(false),
  allowLengthenedPartials: z.coerce.boolean().default(false),
  allowBarbellCompounds: z.coerce.boolean().default(true),
  allowHighSpinalLoading: z.coerce.boolean().default(false),
  weakMusclePriorities: stringList,
  useAbVariation: z.coerce.boolean().default(true),
  preferredProgressionStyle: progressionStyle.default("double progression"),
  deloadTriggerSensitivity: z.enum(["conservative", "moderate", "aggressive"]).default("moderate")
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
