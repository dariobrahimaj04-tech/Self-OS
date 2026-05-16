export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type FitnessGoal = "hypertrophy" | "strength" | "recomposition" | "general fitness";

export type FitnessProfileInput = {
  age: number;
  heightCm: number;
  weightKg: number;
  trainingExperience: ExperienceLevel;
  primaryGoal: FitnessGoal;
  secondaryGoal?: string;
  daysAvailablePerWeek: number;
  preferredWorkoutDuration: number;
  availableEquipment: string[];
  weakMuscleGroups: string[];
  injuriesOrLimitations?: string;
  sleepAverage: number;
  stressLevel: number;
  recoveryQuality: number;
  preferredSplit: "full body" | "upper/lower" | "push/pull/legs" | "body part split" | "custom";
  strengthNumbers: Record<string, number>;
};

export type ExerciseRecord = {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string;
  equipment: string[];
  difficultyLevel: ExperienceLevel | "all";
  hypertrophyRating: number;
  strengthRating: number;
  stabilityRating: number;
  rangeOfMotion: number;
  fatigueCost: number;
  jointFriendliness: number;
  notes: string;
  cautions?: string;
  suggestedRepRange: string;
};

export type PlanExercise = {
  exerciseName: string;
  primaryMuscle: string;
  sets: number;
  repRange: string;
  targetRir: number;
  restSeconds: number;
  rationale: string;
};

export type PlanDay = {
  dayIndex: number;
  name: string;
  focusMuscles: string[];
  exercises: PlanExercise[];
};

export type MuscleVolume = {
  muscle: string;
  mev: number;
  mav: number;
  mrv: number;
  plannedSets: number;
  recommendation: string;
};

export type GeneratedWorkoutPlan = {
  name: string;
  split: string;
  mesocycleWeek: number;
  days: PlanDay[];
  volume: MuscleVolume[];
  notes: string[];
};

export type DailyCheckInView = {
  date: string;
  moodScore: number;
  energyScore: number;
  stressScore: number;
  sleepHours: number;
  sleepQuality: number;
  productivityScore: number;
  socialConnectionScore: number;
  waterIntakeLiters: number;
  notes?: string;
};

export type MealView = {
  id: string;
  date: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterLiters?: number;
  notes?: string;
  energyImpact?: string;
  favorite?: boolean;
};

export type MoodLogView = {
  id?: string;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleepQuality: number;
  socialConnection: number;
  anxietyLevel: number;
  productivity: number;
  notes?: string;
};

export type JournalEntryView = {
  id: string;
  date: string;
  mode: string;
  title: string;
  content: string;
  completed: boolean;
};

export type HabitView = {
  id: string;
  name: string;
  category: string;
  frequency: string;
  targetDays: string[];
  streak: number;
  weeklyCompletion: number;
  monthlyCompletion: number;
  completedToday: boolean;
  notes?: string;
};

export type GoalView = {
  id: string;
  title: string;
  category: string;
  description: string;
  startDate: string;
  targetDate: string;
  priority: string;
  status: string;
  progressPercentage: number;
  milestones: string[];
  tasks: string[];
  weeklyReviewNotes?: string;
};

export type LearningItemView = {
  id: string;
  name: string;
  category: string;
  currentLevel: string;
  targetLevel: string;
  studyMinutes: number;
  resourceLink?: string;
  notes?: string;
  confidenceScore: number;
  relatedProjects: string[];
  completionPercentage: number;
};

export type FinanceTransactionView = {
  id: string;
  type: "income" | "expense" | "debt" | "subscription";
  amount: number;
  category: string;
  date: string;
  notes?: string;
};

export type InsightView = {
  id: string;
  category: string;
  title: string;
  body: string;
  confidence: number;
};

export type WorkoutPerformancePoint = {
  date: string;
  performance: number;
  stress: number;
  sleepHours: number;
  protein: number;
  trained: boolean;
};

export type WorkoutLogView = {
  id: string;
  date: string;
  title: string;
  durationMinutes: number;
  sessionDifficulty: number;
  performanceTrend: "improved" | "stable" | "dropped";
  notes?: string;
};
