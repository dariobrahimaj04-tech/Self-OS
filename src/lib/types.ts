export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type FitnessGoal = "hypertrophy" | "strength" | "recomposition" | "general fitness";
export type PreferredSplit = "full body" | "upper/lower" | "push/pull/legs" | "hybrid" | "custom";
export type ProgressionStyle = "add reps first" | "add load first" | "double progression";
export type FatigueLevel = "low" | "moderate" | "high";
export type SpinalLoading = "none" | "low" | "moderate" | "high";

export type FitnessProfileInput = {
  age: number;
  heightCm: number;
  weightKg: number;
  trainingExperience: ExperienceLevel;
  monthsOrYearsTraining?: string;
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
  preferredSplit: PreferredSplit;
  strengthNumbers: Record<string, number>;
  preferredExercises?: string[];
  favoriteExercises?: string[];
  blockedExercises?: string[];
  painfulExercises?: string[];
  allowAdvancedExercises?: boolean;
  allowMyoReps?: boolean;
  allowLengthenedPartials?: boolean;
  allowBarbellCompounds?: boolean;
  allowHighSpinalLoadingExercises?: boolean;
  preferredProgressionStyle?: ProgressionStyle;
};

export type FitnessProgrammingSettings = {
  preferredSplit: PreferredSplit;
  trainingDays: number;
  mesocycleLength: number;
  defaultRirProgression: number[];
  defaultMinSets: number;
  defaultMaxSets: number;
  preferredExercises: string[];
  favoriteExercises: string[];
  blockedExercises: string[];
  painfulExercises: string[];
  allowAdvancedExercises: boolean;
  allowMyoReps: boolean;
  allowLengthenedPartials: boolean;
  allowBarbellCompounds: boolean;
  allowHighSpinalLoading: boolean;
  weakMusclePriorities: string[];
  useAbVariation: boolean;
  preferredProgressionStyle: ProgressionStyle;
  deloadTriggerSensitivity: "conservative" | "moderate" | "aggressive";
};

export type ExerciseRecord = {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string;
  equipment: string[];
  difficultyLevel: ExperienceLevel | "all";
  experienceTier?: ExperienceLevel | "all";
  technicalDifficulty?: number;
  hypertrophyRating: number;
  strengthRating: number;
  stabilityRating: number;
  rangeOfMotion: number;
  rangeOfMotionRating?: number;
  fatigueCost: number;
  jointFriendliness: number;
  spinalLoading?: SpinalLoading;
  systemicFatigue?: FatigueLevel;
  jointStress?: FatigueLevel;
  notes: string;
  cautions?: string;
  suggestedRepRange: string;
  suggestedRestRange?: string;
  advancedMethodAllowed?: boolean;
  alternatives?: string[];
};

export type PlanExercise = {
  exerciseName: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  movementPattern?: string;
  sets: number;
  repRange: string;
  targetRir: number;
  restSeconds: number;
  rationale: string;
  advancedMethod?: string;
  fatigueCost?: number;
  spinalLoading?: SpinalLoading;
  exerciseTier?: ExperienceLevel | "all";
  substitutionNote?: string;
  source?: "curated" | "custom";
  isCustom?: boolean;
  targetMuscleInferred?: boolean;
  customWarning?: string;
  technicalDifficulty?: number | "unknown" | "moderate";
  hypertrophyRating?: number | "unknown";
  stabilityRating?: number | "unknown";
  notes?: string;
};

export type PlanDay = {
  dayIndex: number;
  name: string;
  focusMuscles: string[];
  recoveryRole?: string;
  fatigueLevel?: FatigueLevel;
  spinalLoading?: SpinalLoading;
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

export type PlanVersion = {
  versionNumber: number;
  timestamp: string;
  label: string;
  summary: string[];
  plan: Omit<GeneratedWorkoutPlan, "versionHistory">;
};

export type WeeklyAdjustmentRecommendation = {
  id: string;
  muscle: string;
  title: string;
  recommendation: string;
  reason: string;
  action: "add_set" | "remove_set" | "maintain" | "replace_exercise" | "deload" | "rir_up" | "rir_down";
  exerciseName?: string;
  setDelta?: number;
  rirDelta?: number;
  selected?: boolean;
};

export type GeneratedWorkoutPlan = {
  name: string;
  split: string;
  templateName?: string;
  mesocycleWeek: number;
  days: PlanDay[];
  volume: MuscleVolume[];
  notes: string[];
  weeklyLayout?: Array<{ day: string; name: string; training: boolean; focusMuscles: string[]; note?: string }>;
  rirProgression?: Array<{ week: number; targetRir: string; note: string }>;
  explanation?: string[];
  warnings?: string[];
  unusedPreferredExercises?: Array<{ exercise: string; reason: string; alternatives: string[] }>;
  versionHistory?: PlanVersion[];
  currentVersion?: number;
  lastChangeSummary?: string[];
  weeklyAdjustments?: WeeklyAdjustmentRecommendation[];
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

export type HabitLogView = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  skipReason?: string;
  notes?: string;
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
  workoutPlanId?: string;
  feedback?: {
    pumpScore?: number;
    targetMuscleFeel?: number;
    jointPain?: "none" | "mild" | "moderate" | "severe";
    sorenessExpected?: "low" | "moderate" | "high";
    sessionDifficulty?: number;
    performance?: "better" | "same" | "worse";
    recovery?: "good" | "okay" | "poor";
    notes?: string;
  };
  execution?: {
    dayName?: string;
    completedSets?: number;
    skippedSets?: number;
    totalVolumeLoad?: number;
    musclesTrained?: string[];
    exerciseSummaries?: Array<{
      exerciseName: string;
      completedSets: number;
      skippedSets: number;
      volumeLoad: number;
      notes?: string;
    }>;
  };
};
