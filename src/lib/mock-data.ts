import type {
  DailyCheckInView,
  ExerciseRecord,
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
} from "./types";

const iso = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

export const demoUser = {
  id: "demo-user",
  name: "Alex Morgan",
  email: "alex@example.com"
};

export const fitnessProfile: FitnessProfileInput = {
  age: 31,
  heightCm: 178,
  weightKg: 82,
  trainingExperience: "intermediate",
  monthsOrYearsTraining: "2 years consistent lifting",
  primaryGoal: "hypertrophy",
  secondaryGoal: "strength maintenance",
  daysAvailablePerWeek: 4,
  preferredWorkoutDuration: 70,
  availableEquipment: ["machines", "dumbbells", "cables", "barbell", "bodyweight"],
  weakMuscleGroups: ["shoulders", "hamstrings", "calves"],
  injuriesOrLimitations: "Occasional cranky right shoulder on deep dips",
  sleepAverage: 7.1,
  stressLevel: 6,
  recoveryQuality: 7,
  preferredSplit: "upper/lower",
  preferredExercises: ["Machine Chest Press", "Lat Pulldown", "Hack Squat", "Cable Lateral Raise"],
  favoriteExercises: ["Seated Leg Curl", "Cable Curl"],
  blockedExercises: [],
  painfulExercises: ["Dips"],
  allowAdvancedExercises: false,
  allowMyoReps: false,
  allowLengthenedPartials: false,
  allowBarbellCompounds: true,
  allowHighSpinalLoadingExercises: false,
  preferredProgressionStyle: "double progression",
  strengthNumbers: {
    benchPress: 225,
    squat: 315,
    deadlift: 365,
    overheadPress: 135
  }
};

export const exerciseDatabase: ExerciseRecord[] = [
  {
    name: "Machine Chest Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Front Delts"],
    movementPattern: "horizontal press",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 3,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 2,
    jointFriendliness: 4,
    notes: "Stable, easy to take close to failure, and simple to progress.",
    cautions: "Adjust seat so elbows track comfortably below shoulder height.",
    suggestedRepRange: "6-15"
  },
  {
    name: "Incline Dumbbell Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    movementPattern: "incline press",
    equipment: ["dumbbells"],
    difficultyLevel: "intermediate",
    hypertrophyRating: 5,
    strengthRating: 4,
    stabilityRating: 3,
    rangeOfMotion: 5,
    fatigueCost: 3,
    jointFriendliness: 4,
    notes: "Excellent upper chest stimulus with natural wrist and elbow path.",
    suggestedRepRange: "6-12"
  },
  {
    name: "Cable Fly",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts"],
    movementPattern: "adduction",
    equipment: ["cables"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 1,
    stabilityRating: 4,
    rangeOfMotion: 5,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "High-tension chest isolation with low systemic fatigue.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Pec Deck",
    primaryMuscle: "Chest",
    secondaryMuscles: [],
    movementPattern: "adduction",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 1,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "Reliable chest isolation when shoulder setup feels good.",
    cautions: "Avoid aggressive stretch if anterior shoulder is irritated.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Lat Pulldown",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps", "Forearms"],
    movementPattern: "vertical pull",
    equipment: ["cables", "machines"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 3,
    stabilityRating: 4,
    rangeOfMotion: 5,
    fatigueCost: 2,
    jointFriendliness: 4,
    notes: "Loadable vertical pull with adjustable grips for joint comfort.",
    suggestedRepRange: "8-15"
  },
  {
    name: "Chest-Supported Row",
    primaryMuscle: "Back",
    secondaryMuscles: ["Rear Delts", "Biceps"],
    movementPattern: "horizontal pull",
    equipment: ["dumbbells", "machines"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 3,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 2,
    jointFriendliness: 5,
    notes: "Back stimulus without much lower-back fatigue.",
    suggestedRepRange: "8-15"
  },
  {
    name: "Cable Row",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps", "Rear Delts"],
    movementPattern: "horizontal pull",
    equipment: ["cables"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 3,
    stabilityRating: 4,
    rangeOfMotion: 4,
    fatigueCost: 2,
    jointFriendliness: 4,
    notes: "Good controllable row with consistent resistance.",
    suggestedRepRange: "8-15"
  },
  {
    name: "Machine Row",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps", "Rear Delts"],
    movementPattern: "horizontal pull",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 3,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 2,
    jointFriendliness: 5,
    notes: "Stable row option that is easy to standardize week to week.",
    suggestedRepRange: "6-15"
  },
  {
    name: "Dumbbell Lateral Raise",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Traps"],
    movementPattern: "shoulder abduction",
    equipment: ["dumbbells"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 1,
    stabilityRating: 3,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "Simple side-delt staple; keep load honest and motion controlled.",
    suggestedRepRange: "12-30"
  },
  {
    name: "Cable Lateral Raise",
    primaryMuscle: "Shoulders",
    secondaryMuscles: [],
    movementPattern: "shoulder abduction",
    equipment: ["cables"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 1,
    stabilityRating: 4,
    rangeOfMotion: 5,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Excellent side-delt tension profile with low fatigue cost.",
    suggestedRepRange: "12-30"
  },
  {
    name: "Rear Delt Fly",
    primaryMuscle: "Rear Delts",
    secondaryMuscles: ["Upper Back"],
    movementPattern: "horizontal abduction",
    equipment: ["machines", "dumbbells", "cables"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 1,
    stabilityRating: 4,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Shoulder-friendly posterior delt and upper back accessory.",
    suggestedRepRange: "12-25"
  },
  {
    name: "Leg Press",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes"],
    movementPattern: "squat",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 3,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 3,
    jointFriendliness: 4,
    notes: "High quad loading with less axial fatigue than barbell squats.",
    suggestedRepRange: "8-20"
  },
  {
    name: "Hack Squat",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes"],
    movementPattern: "squat",
    equipment: ["machines"],
    difficultyLevel: "intermediate",
    hypertrophyRating: 5,
    strengthRating: 4,
    stabilityRating: 5,
    rangeOfMotion: 5,
    fatigueCost: 4,
    jointFriendliness: 3,
    notes: "Highly loadable quad exercise when knees tolerate it.",
    cautions: "Reduce depth or substitute if knee pain appears.",
    suggestedRepRange: "6-15"
  },
  {
    name: "Bulgarian Split Squat",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes", "Adductors"],
    movementPattern: "single-leg squat",
    equipment: ["dumbbells", "bodyweight"],
    difficultyLevel: "intermediate",
    hypertrophyRating: 4,
    strengthRating: 2,
    stabilityRating: 2,
    rangeOfMotion: 5,
    fatigueCost: 3,
    jointFriendliness: 3,
    notes: "Great single-leg stimulus, but balance can limit loading.",
    suggestedRepRange: "8-15"
  },
  {
    name: "Romanian Deadlift",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back"],
    movementPattern: "hinge",
    equipment: ["barbell", "dumbbells"],
    difficultyLevel: "intermediate",
    hypertrophyRating: 5,
    strengthRating: 4,
    stabilityRating: 3,
    rangeOfMotion: 5,
    fatigueCost: 4,
    jointFriendliness: 4,
    notes: "High hamstring tension in a loaded stretch; manage fatigue carefully.",
    cautions: "Stop if low-back pain replaces hamstring tension.",
    suggestedRepRange: "6-12"
  },
  {
    name: "Seated Leg Curl",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: [],
    movementPattern: "knee flexion",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 2,
    stabilityRating: 5,
    rangeOfMotion: 5,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Excellent hamstring isolation with long-muscle-length tension.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Lying Leg Curl",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: [],
    movementPattern: "knee flexion",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 2,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Low-fatigue hamstring isolation option.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Hip Thrust",
    primaryMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    movementPattern: "hip extension",
    equipment: ["barbell", "machines"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 3,
    stabilityRating: 4,
    rangeOfMotion: 3,
    fatigueCost: 2,
    jointFriendliness: 4,
    notes: "Loadable glute exercise with relatively low spinal fatigue.",
    suggestedRepRange: "8-15"
  },
  {
    name: "Standing Calf Raise",
    primaryMuscle: "Calves",
    secondaryMuscles: [],
    movementPattern: "plantar flexion",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 2,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Biases gastrocnemius; pause in stretched and shortened positions.",
    suggestedRepRange: "8-20"
  },
  {
    name: "Seated Calf Raise",
    primaryMuscle: "Calves",
    secondaryMuscles: [],
    movementPattern: "plantar flexion",
    equipment: ["machines"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 2,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Biases soleus and is easy to recover from.",
    suggestedRepRange: "10-25"
  },
  {
    name: "Cable Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
    movementPattern: "elbow flexion",
    equipment: ["cables"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 1,
    stabilityRating: 4,
    rangeOfMotion: 5,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Consistent tension and easy progression for biceps.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Incline Dumbbell Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
    movementPattern: "elbow flexion",
    equipment: ["dumbbells"],
    difficultyLevel: "intermediate",
    hypertrophyRating: 5,
    strengthRating: 1,
    stabilityRating: 3,
    rangeOfMotion: 5,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "Strong lengthened biceps stimulus; keep shoulders comfortable.",
    suggestedRepRange: "8-15"
  },
  {
    name: "Preacher Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
    movementPattern: "elbow flexion",
    equipment: ["machines", "dumbbells"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 2,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "Stable curl with strict execution and easy proximity to failure.",
    suggestedRepRange: "8-15"
  },
  {
    name: "Rope Pressdown",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
    movementPattern: "elbow extension",
    equipment: ["cables"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 1,
    stabilityRating: 5,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 5,
    notes: "Elbow-friendly triceps option with simple setup.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Overhead Cable Triceps Extension",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
    movementPattern: "elbow extension",
    equipment: ["cables"],
    difficultyLevel: "all",
    hypertrophyRating: 5,
    strengthRating: 1,
    stabilityRating: 4,
    rangeOfMotion: 5,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "Targets long head in a lengthened position.",
    cautions: "Use a shoulder position that feels natural and pain-free.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Cable Crunch",
    primaryMuscle: "Abs",
    secondaryMuscles: [],
    movementPattern: "spinal flexion",
    equipment: ["cables"],
    difficultyLevel: "all",
    hypertrophyRating: 4,
    strengthRating: 2,
    stabilityRating: 4,
    rangeOfMotion: 4,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "Loadable ab training with easy progressive overload.",
    suggestedRepRange: "10-20"
  },
  {
    name: "Hanging Knee Raise",
    primaryMuscle: "Abs",
    secondaryMuscles: ["Hip Flexors", "Forearms"],
    movementPattern: "hip flexion",
    equipment: ["bodyweight"],
    difficultyLevel: "intermediate",
    hypertrophyRating: 3,
    strengthRating: 2,
    stabilityRating: 2,
    rangeOfMotion: 4,
    fatigueCost: 2,
    jointFriendliness: 3,
    notes: "Good trunk and hip-flexion challenge when grip is not limiting.",
    suggestedRepRange: "8-20"
  },
  {
    name: "Wrist Roller",
    primaryMuscle: "Forearms",
    secondaryMuscles: [],
    movementPattern: "wrist flexion extension",
    equipment: ["cables", "dumbbells"],
    difficultyLevel: "all",
    hypertrophyRating: 3,
    strengthRating: 2,
    stabilityRating: 4,
    rangeOfMotion: 3,
    fatigueCost: 1,
    jointFriendliness: 4,
    notes: "Simple forearm finisher with low systemic fatigue.",
    suggestedRepRange: "30-60 seconds"
  }
];

export const checkIns: DailyCheckInView[] = [
  { date: iso(0), moodScore: 8, energyScore: 7, stressScore: 4, sleepHours: 7.4, sleepQuality: 8, productivityScore: 8, socialConnectionScore: 7, waterIntakeLiters: 2.6, notes: "Solid morning routine and focused work block." },
  { date: iso(1), moodScore: 7, energyScore: 6, stressScore: 6, sleepHours: 6.5, sleepQuality: 6, productivityScore: 7, socialConnectionScore: 6, waterIntakeLiters: 2.1, notes: "Good training, slightly rushed evening." },
  { date: iso(2), moodScore: 6, energyScore: 5, stressScore: 8, sleepHours: 5.9, sleepQuality: 5, productivityScore: 5, socialConnectionScore: 5, waterIntakeLiters: 1.7, notes: "High workload. Kept nutrition reasonable." },
  { date: iso(3), moodScore: 8, energyScore: 8, stressScore: 4, sleepHours: 7.8, sleepQuality: 8, productivityScore: 8, socialConnectionScore: 8, waterIntakeLiters: 2.8, notes: "Journal helped clear next actions." },
  { date: iso(4), moodScore: 7, energyScore: 7, stressScore: 5, sleepHours: 7.1, sleepQuality: 7, productivityScore: 7, socialConnectionScore: 6, waterIntakeLiters: 2.4, notes: "Normal day." },
  { date: iso(5), moodScore: 5, energyScore: 5, stressScore: 7, sleepHours: 6.2, sleepQuality: 5, productivityScore: 6, socialConnectionScore: 5, waterIntakeLiters: 1.8, notes: "Skipped evening walk." },
  { date: iso(6), moodScore: 8, energyScore: 8, stressScore: 3, sleepHours: 8.1, sleepQuality: 9, productivityScore: 8, socialConnectionScore: 8, waterIntakeLiters: 2.9, notes: "Best recovery day of the week." }
];

export const meals: MealView[] = [
  { id: "meal-1", date: iso(0), mealType: "Breakfast", foodName: "Greek yogurt bowl", calories: 510, protein: 42, carbs: 58, fats: 12, waterLiters: 0.5, notes: "Easy high-protein start.", energyImpact: "steady", favorite: true },
  { id: "meal-2", date: iso(0), mealType: "Lunch", foodName: "Chicken rice bowl", calories: 720, protein: 55, carbs: 82, fats: 18, waterLiters: 0.7, energyImpact: "good training energy" },
  { id: "meal-3", date: iso(0), mealType: "Dinner", foodName: "Salmon, potatoes, salad", calories: 780, protein: 48, carbs: 66, fats: 32, waterLiters: 0.6 },
  { id: "meal-4", date: iso(1), mealType: "Breakfast", foodName: "Eggs and toast", calories: 460, protein: 31, carbs: 34, fats: 22, waterLiters: 0.4 },
  { id: "meal-5", date: iso(1), mealType: "Dinner", foodName: "Turkey chili", calories: 680, protein: 52, carbs: 68, fats: 18, waterLiters: 0.5, favorite: true },
  { id: "meal-6", date: iso(2), mealType: "Lunch", foodName: "Tuna wrap", calories: 560, protein: 43, carbs: 54, fats: 16, waterLiters: 0.4 }
];

export const moodLogs: MoodLogView[] = checkIns.map((entry, index) => ({
  date: entry.date,
  mood: entry.moodScore,
  energy: entry.energyScore,
  stress: entry.stressScore,
  sleepQuality: entry.sleepQuality,
  socialConnection: entry.socialConnectionScore,
  anxietyLevel: Math.min(10, Math.max(1, entry.stressScore + (index % 2))),
  productivity: entry.productivityScore,
  notes: entry.notes
}));

export const journalEntries: JournalEntryView[] = [
  { id: "journal-1", date: iso(0), mode: "Daily reflection", title: "Focused and grounded", content: "What went well: deep work and a good lunch prep. Difficult: a late meeting. Tomorrow: protect the first work block.", completed: true },
  { id: "journal-2", date: iso(3), mode: "Weekly review", title: "Consistency is compounding", content: "Improved training rhythm. Avoided budgeting until Friday. Main focus next week: earlier shutdown.", completed: true },
  { id: "journal-3", date: iso(5), mode: "Gratitude", title: "Small stabilizers", content: "Grateful for a quiet morning, a useful course lesson, and dinner already planned.", completed: true }
];

export const habits: HabitView[] = [
  { id: "habit-1", name: "Morning sunlight walk", category: "Health", frequency: "Daily", targetDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], streak: 6, weeklyCompletion: 86, monthlyCompletion: 78, completedToday: true },
  { id: "habit-2", name: "Protein target", category: "Nutrition", frequency: "Daily", targetDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], streak: 4, weeklyCompletion: 71, monthlyCompletion: 74, completedToday: true },
  { id: "habit-3", name: "Journal", category: "Reflection", frequency: "5x/week", targetDays: ["Mon", "Tue", "Wed", "Thu", "Sun"], streak: 2, weeklyCompletion: 60, monthlyCompletion: 64, completedToday: true },
  { id: "habit-4", name: "Study block", category: "Learning", frequency: "Weekdays", targetDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], streak: 3, weeklyCompletion: 80, monthlyCompletion: 69, completedToday: false }
];

export const goals: GoalView[] = [
  { id: "goal-1", title: "Build a data portfolio", category: "Career", description: "Publish three practical analytics projects.", startDate: iso(45), targetDate: iso(-75), priority: "High", status: "Active", progressPercentage: 62, milestones: ["SQL case study", "Power BI dashboard", "ML notebook"], tasks: ["Clean bike-share dataset", "Write README", "Record walkthrough"], weeklyReviewNotes: "Strong SQL progress, needs a clearer project story." },
  { id: "goal-2", title: "Run a consistent hypertrophy block", category: "Fitness", description: "Complete a conservative 8-week upper/lower mesocycle.", startDate: iso(14), targetDate: iso(-42), priority: "High", status: "Active", progressPercentage: 38, milestones: ["Weeks 1-3 accumulation", "Week 4 feedback", "Week 8 deload"], tasks: ["Log RIR", "Track soreness", "Update volume targets"], weeklyReviewNotes: "Keep shoulder-friendly pressing." },
  { id: "goal-3", title: "Emergency fund", category: "Finance", description: "Increase emergency savings to three months of expenses.", startDate: iso(90), targetDate: iso(-180), priority: "Medium", status: "Active", progressPercentage: 54, milestones: ["$5k", "$7.5k", "$10k"], tasks: ["Review subscriptions", "Automate transfer"], weeklyReviewNotes: "Subscriptions review saved $34/month." }
];

export const learningItems: LearningItemView[] = [
  { id: "learn-1", name: "SQL joins and windows", category: "SQL", currentLevel: "Intermediate", targetLevel: "Advanced", studyMinutes: 155, resourceLink: "https://mode.com/sql-tutorial", notes: "Focus on window functions and cohort queries.", confidenceScore: 7, relatedProjects: ["Bike-share retention dashboard"], completionPercentage: 64 },
  { id: "learn-2", name: "Machine learning fundamentals", category: "Machine learning", currentLevel: "Beginner", targetLevel: "Intermediate", studyMinutes: 95, notes: "Review model evaluation and leakage.", confidenceScore: 5, relatedProjects: ["Churn prediction notebook"], completionPercentage: 32 },
  { id: "learn-3", name: "Power BI report polish", category: "Power BI", currentLevel: "Intermediate", targetLevel: "Advanced", studyMinutes: 70, notes: "Improve layout and DAX measures.", confidenceScore: 6, relatedProjects: ["Personal finance dashboard"], completionPercentage: 48 }
];

export const financeTransactions: FinanceTransactionView[] = [
  { id: "fin-1", type: "income", amount: 3200, category: "Paycheck", date: iso(2), notes: "Primary income" },
  { id: "fin-2", type: "expense", amount: 86, category: "Groceries", date: iso(0), notes: "Meal prep basics" },
  { id: "fin-3", type: "expense", amount: 44, category: "Transportation", date: iso(1) },
  { id: "fin-4", type: "subscription", amount: 18, category: "Software", date: iso(3), notes: "Course platform" },
  { id: "fin-5", type: "expense", amount: 64, category: "Dining", date: iso(5) },
  { id: "fin-6", type: "debt", amount: 250, category: "Student loan", date: iso(6), notes: "Scheduled payment" }
];

export const performancePoints: WorkoutPerformancePoint[] = [
  { date: iso(6), performance: 8, stress: 3, sleepHours: 8.1, protein: 168, trained: true },
  { date: iso(5), performance: 5, stress: 7, sleepHours: 6.2, protein: 121, trained: false },
  { date: iso(4), performance: 7, stress: 5, sleepHours: 7.1, protein: 152, trained: true },
  { date: iso(3), performance: 8, stress: 4, sleepHours: 7.8, protein: 171, trained: false },
  { date: iso(2), performance: 5, stress: 8, sleepHours: 5.9, protein: 116, trained: true },
  { date: iso(1), performance: 7, stress: 6, sleepHours: 6.5, protein: 149, trained: true },
  { date: iso(0), performance: 8, stress: 4, sleepHours: 7.4, protein: 145, trained: false }
];

export const workoutLogs: WorkoutLogView[] = [
  { id: "workout-1", date: iso(1), title: "Upper A", durationMinutes: 68, sessionDifficulty: 7, performanceTrend: "improved", notes: "Chest-supported rows moved well. Shoulder felt fine." },
  { id: "workout-2", date: iso(2), title: "Lower A", durationMinutes: 72, sessionDifficulty: 8, performanceTrend: "stable", notes: "Hack squat was hard but clean. Hamstring soreness moderate." },
  { id: "workout-3", date: iso(4), title: "Upper B", durationMinutes: 64, sessionDifficulty: 6, performanceTrend: "stable", notes: "Kept pressing conservative and used cable fly." },
  { id: "workout-4", date: iso(6), title: "Lower B", durationMinutes: 70, sessionDifficulty: 7, performanceTrend: "improved", notes: "RDL reps improved at same RIR." }
];

export const insights: InsightView[] = [
  { id: "insight-1", category: "Recovery", title: "Sleep threshold", body: "Your mood is usually higher on days when you sleep 7 or more hours.", confidence: 0.78 },
  { id: "insight-2", category: "Fitness", title: "Stress affects output", body: "Workout performance tends to drop when stress is above 7.", confidence: 0.72 },
  { id: "insight-3", category: "Productivity", title: "Journaling signal", body: "Productivity is higher on days you complete a journal entry.", confidence: 0.67 },
  { id: "insight-4", category: "Habits", title: "Weekday consistency", body: "You are most consistent with habits on weekdays.", confidence: 0.7 }
];
