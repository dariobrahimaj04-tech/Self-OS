import { fitnessProfile } from "./mock-data";
import type {
  ExerciseRecord,
  ExperienceLevel,
  FatigueLevel,
  FitnessProgrammingSettings,
  FitnessProfileInput,
  GeneratedWorkoutPlan,
  MuscleVolume,
  PlanDay,
  PlanExercise,
  PreferredSplit,
  SpinalLoading
} from "./types";

export type CuratedExercise = ExerciseRecord & {
  experienceTier: ExperienceLevel | "all";
  technicalDifficulty: number;
  rangeOfMotionRating: number;
  spinalLoading: SpinalLoading;
  systemicFatigue: FatigueLevel;
  jointStress: FatigueLevel;
  suggestedRestRange: string;
  advancedMethodAllowed: boolean;
  alternatives: string[];
};

type Feedback = {
  performanceTrend?: "improved" | "stable" | "dropped";
  soreness?: number;
  jointPain?: boolean;
  recoveryQuality?: number;
};

type ProgramSettingsInput = Partial<FitnessProgrammingSettings>;

type DayBlueprint = {
  name: string;
  focusMuscles: string[];
  slots: Array<{
    primaryMuscle: string;
    movementPatterns: string[];
    emphasis?: string;
    avoidHighSpinalLoading?: boolean;
    isolationPreferred?: boolean;
  }>;
  fatigueLevel: FatigueLevel;
  spinalLoading: SpinalLoading;
  recoveryRole: string;
};

const allMuscles = [
  "Chest",
  "Back",
  "Shoulders",
  "Rear Delts",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Forearms"
];

const majorMuscles = new Set(["Chest", "Back", "Quads", "Hamstrings", "Glutes", "Shoulders"]);
const isolationPatterns = new Set([
  "fly",
  "shoulder abduction",
  "horizontal abduction",
  "elbow flexion",
  "elbow extension",
  "plantar flexion",
  "spinal flexion",
  "wrist flexion",
  "knee flexion",
  "knee extension"
]);

const equipmentAliases: Record<string, string[]> = {
  machines: ["machines"],
  machine: ["machines"],
  cables: ["cables"],
  cable: ["cables"],
  dumbbells: ["dumbbells"],
  dumbbell: ["dumbbells"],
  barbell: ["barbell"],
  smith: ["smith machine"],
  "smith machine": ["smith machine"],
  bodyweight: ["bodyweight"],
  "body weight": ["bodyweight"],
  "pull-up bar": ["bodyweight"],
  "ez bar": ["ez bar", "barbell"]
};

function exercise(input: CuratedExercise): CuratedExercise {
  return input;
}

export const curatedExerciseLibrary: CuratedExercise[] = [
  exercise({ name: "Machine Chest Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], movementPattern: "horizontal press", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 5, strengthRating: 3, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Stable, loadable chest press with a strong stimulus-to-fatigue profile.", cautions: "Adjust seat and elbow path if shoulders feel irritated.", suggestedRepRange: "6-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Incline Machine Press", "Flat Dumbbell Press", "Incline Dumbbell Press"] }),
  exercise({ name: "Incline Dumbbell Press", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], movementPattern: "incline press", equipment: ["dumbbells"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 3, hypertrophyRating: 5, strengthRating: 4, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "moderate", notes: "High upper-chest stimulus with natural wrist and elbow paths.", suggestedRepRange: "6-12", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Incline Machine Press", "Machine Chest Press"] }),
  exercise({ name: "Flat Dumbbell Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], movementPattern: "horizontal press", equipment: ["dumbbells"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 3, hypertrophyRating: 4, strengthRating: 4, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "moderate", notes: "Loadable horizontal press with good range of motion.", suggestedRepRange: "6-12", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Machine Chest Press", "Incline Dumbbell Press"] }),
  exercise({ name: "Incline Machine Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], movementPattern: "incline press", equipment: ["machines"], difficultyLevel: "all", experienceTier: "intermediate", technicalDifficulty: 2, hypertrophyRating: 5, strengthRating: 3, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Stable incline option for higher quality chest volume.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Incline Dumbbell Press", "Machine Chest Press"] }),
  exercise({ name: "Cable Fly", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], movementPattern: "fly", equipment: ["cables"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 4, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Low-fatigue chest isolation with adjustable line of pull.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Pec Deck", "Incline Dumbbell Flyes"] }),
  exercise({ name: "Pec Deck", primaryMuscle: "Chest", secondaryMuscles: [], movementPattern: "fly", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Stable isolation option when shoulders tolerate the stretch.", cautions: "Avoid aggressive stretch if anterior shoulder pain appears.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Fly", "Incline Dumbbell Flyes"] }),
  exercise({ name: "Incline Cambered Bar Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], movementPattern: "incline press", equipment: ["barbell"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 5, hypertrophyRating: 5, strengthRating: 4, stabilityRating: 2, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 4, jointFriendliness: 3, spinalLoading: "low", systemicFatigue: "moderate", jointStress: "moderate", notes: "Advanced stretch-biased pressing option for skilled lifters.", cautions: "Use only when shoulders tolerate deep range of motion.", suggestedRepRange: "6-10", suggestedRestRange: "120-180s", advancedMethodAllowed: false, alternatives: ["Incline Dumbbell Press", "Incline Machine Press"] }),
  exercise({ name: "Incline Dumbbell Flyes", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], movementPattern: "fly", equipment: ["dumbbells"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 2, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 2, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "low", jointStress: "moderate", notes: "Advanced lengthened chest isolation that requires controlled execution.", cautions: "Do not use if shoulders feel unstable or painful.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Fly", "Pec Deck"] }),
  exercise({ name: "Lat Pulldown", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Forearms"], movementPattern: "vertical pull", equipment: ["cables", "machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 5, strengthRating: 3, stabilityRating: 4, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 2, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Joint-friendly, loadable vertical pull with easy grip changes.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Assisted Pull-Up", "Unweighted Parallel Pull-Ups"] }),
  exercise({ name: "Assisted Pull-Up", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Forearms"], movementPattern: "vertical pull", equipment: ["machines", "bodyweight"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 3, hypertrophyRating: 4, strengthRating: 3, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "low", notes: "Good bridge from pulldowns to pull-ups when control is solid.", suggestedRepRange: "6-12", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Lat Pulldown", "Pull-Up"] }),
  exercise({ name: "Pull-Up", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Forearms"], movementPattern: "vertical pull", equipment: ["bodyweight"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 4, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "moderate", notes: "High-quality vertical pull if bodyweight strength is sufficient.", suggestedRepRange: "5-12", suggestedRestRange: "120-180s", advancedMethodAllowed: false, alternatives: ["Lat Pulldown", "Assisted Pull-Up"] }),
  exercise({ name: "Weighted Parallel Pull-Ups", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Forearms"], movementPattern: "vertical pull", equipment: ["bodyweight"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 5, hypertrophyRating: 5, strengthRating: 5, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 4, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "high", jointStress: "moderate", notes: "Advanced loadable vertical pull for strong lifters.", cautions: "Avoid if elbows or shoulders object.", suggestedRepRange: "5-10", suggestedRestRange: "120-180s", advancedMethodAllowed: false, alternatives: ["Unweighted Parallel Pull-Ups", "Lat Pulldown"] }),
  exercise({ name: "Unweighted Parallel Pull-Ups", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Forearms"], movementPattern: "vertical pull", equipment: ["bodyweight"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 4, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "low", notes: "Shoulder-friendly advanced pull-up variation for higher reps.", suggestedRepRange: "6-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Lat Pulldown", "Assisted Pull-Up"] }),
  exercise({ name: "Weighted Overhand Pull-Ups", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Forearms"], movementPattern: "vertical pull", equipment: ["bodyweight"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 5, hypertrophyRating: 5, strengthRating: 5, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 4, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "high", jointStress: "moderate", notes: "Advanced vertical pull for users who recover well.", suggestedRepRange: "5-10", suggestedRestRange: "120-180s", advancedMethodAllowed: false, alternatives: ["Unweighted Overhand Pull-Ups", "Lat Pulldown"] }),
  exercise({ name: "Unweighted Overhand Pull-Ups", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Forearms"], movementPattern: "vertical pull", equipment: ["bodyweight"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 4, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "moderate", notes: "Advanced bodyweight vertical pull.", suggestedRepRange: "6-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Lat Pulldown", "Assisted Pull-Up"] }),
  exercise({ name: "Chest-Supported Row", primaryMuscle: "Back", secondaryMuscles: ["Rear Delts", "Biceps"], movementPattern: "horizontal pull", equipment: ["dumbbells", "machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 5, strengthRating: 3, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Back stimulus without lower-back fatigue.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Machine Row", "Cable Row"] }),
  exercise({ name: "Machine Chest-Supported Rows", primaryMuscle: "Back", secondaryMuscles: ["Rear Delts", "Biceps"], movementPattern: "horizontal pull", equipment: ["machines"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 3, hypertrophyRating: 5, strengthRating: 4, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Advanced-friendly high-output row that preserves spinal recovery.", suggestedRepRange: "6-12", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Chest-Supported Row", "Machine Row"] }),
  exercise({ name: "Seated Cable Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], movementPattern: "horizontal pull", equipment: ["cables"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 3, stabilityRating: 4, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 4, spinalLoading: "low", systemicFatigue: "low", jointStress: "low", notes: "Controllable row with consistent resistance.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Machine Row", "Chest-Supported Row"] }),
  exercise({ name: "Cable Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], movementPattern: "horizontal pull", equipment: ["cables"], difficultyLevel: "all", experienceTier: "intermediate", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 3, stabilityRating: 4, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 4, spinalLoading: "low", systemicFatigue: "low", jointStress: "low", notes: "Solid row variation for A/B programming.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Machine Row", "Chest-Supported Row"] }),
  exercise({ name: "Machine Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], movementPattern: "horizontal pull", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 5, strengthRating: 3, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Stable row that is easy to standardize week to week.", suggestedRepRange: "6-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Chest-Supported Row", "Cable Row"] }),
  exercise({ name: "Smith Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], movementPattern: "horizontal pull", equipment: ["smith machine"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 3, hypertrophyRating: 4, strengthRating: 4, stabilityRating: 3, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 3, jointFriendliness: 4, spinalLoading: "moderate", systemicFatigue: "moderate", jointStress: "low", notes: "Loadable row if hip hinge position is well tolerated.", suggestedRepRange: "6-12", suggestedRestRange: "120-150s", advancedMethodAllowed: false, alternatives: ["Machine Row", "Chest-Supported Row"] }),
  exercise({ name: "Deficit Barbell Bent-Over Rows", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts", "Glutes", "Hamstrings"], movementPattern: "horizontal pull", equipment: ["barbell"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 5, hypertrophyRating: 5, strengthRating: 5, stabilityRating: 2, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 5, jointFriendliness: 3, spinalLoading: "high", systemicFatigue: "high", jointStress: "moderate", notes: "Very advanced row with major spinal and systemic fatigue.", cautions: "Do not stack near hard hinge or squat days.", suggestedRepRange: "6-10", suggestedRestRange: "150-180s", advancedMethodAllowed: false, alternatives: ["Machine Chest-Supported Rows", "Chest-Supported Row"] }),
  exercise({ name: "Machine Shoulder Press", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Front Delts"], movementPattern: "vertical press", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 3, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Stable overhead pattern for shoulder volume.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Standing Overhead Barbell Press", "Dumbbell Seated Lateral Raises"] }),
  exercise({ name: "Standing Overhead Barbell Press", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Upper Chest"], movementPattern: "vertical press", equipment: ["barbell"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 5, hypertrophyRating: 3, strengthRating: 5, stabilityRating: 2, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 4, jointFriendliness: 3, spinalLoading: "moderate", systemicFatigue: "high", jointStress: "moderate", notes: "Advanced strength-biased shoulder movement with higher fatigue cost.", suggestedRepRange: "5-10", suggestedRestRange: "150-180s", advancedMethodAllowed: false, alternatives: ["Machine Shoulder Press", "Cable Y-Raises"] }),
  exercise({ name: "Cable Lateral Raise", primaryMuscle: "Shoulders", secondaryMuscles: [], movementPattern: "shoulder abduction", equipment: ["cables"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 5, strengthRating: 1, stabilityRating: 4, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Excellent side-delt tension profile with low fatigue.", suggestedRepRange: "12-30", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Dumbbell Lateral Raise", "Super ROM Lateral Raises"] }),
  exercise({ name: "Dumbbell Lateral Raise", primaryMuscle: "Shoulders", secondaryMuscles: ["Traps"], movementPattern: "shoulder abduction", equipment: ["dumbbells"], difficultyLevel: "all", experienceTier: "intermediate", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 3, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Simple side-delt staple when execution stays strict.", suggestedRepRange: "12-30", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Lateral Raise", "Dumbbell Seated Lateral Raises"] }),
  exercise({ name: "Cable Y-Raises", primaryMuscle: "Shoulders", secondaryMuscles: ["Rear Delts", "Lower Traps"], movementPattern: "shoulder abduction", equipment: ["cables"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Advanced shoulder isolation with a long range and high execution demand.", suggestedRepRange: "12-25", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Lateral Raise", "Rear Delt Fly"] }),
  exercise({ name: "Super ROM Lateral Raises", primaryMuscle: "Shoulders", secondaryMuscles: [], movementPattern: "shoulder abduction", equipment: ["dumbbells", "cables"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 5, strengthRating: 1, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 2, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "low", jointStress: "moderate", notes: "Advanced side-delt option for lifters with pain-free shoulder range.", suggestedRepRange: "12-25", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Lateral Raise", "Dumbbell Lateral Raise"] }),
  exercise({ name: "Dumbbell Seated Lateral Raises", primaryMuscle: "Shoulders", secondaryMuscles: [], movementPattern: "shoulder abduction", equipment: ["dumbbells"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 3, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 4, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Stable lateral raise variation for strict execution.", suggestedRepRange: "12-30", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Lateral Raise", "Dumbbell Lateral Raise"] }),
  exercise({ name: "Rear Delt Fly", primaryMuscle: "Rear Delts", secondaryMuscles: ["Upper Back"], movementPattern: "horizontal abduction", equipment: ["machines", "dumbbells", "cables"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 4, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Shoulder-friendly posterior delt and upper-back accessory.", suggestedRepRange: "12-25", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Y-Raises", "Machine Row"] }),
  exercise({ name: "Leg Press", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], movementPattern: "squat", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 5, strengthRating: 3, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 3, jointFriendliness: 4, spinalLoading: "low", systemicFatigue: "moderate", jointStress: "moderate", notes: "High quad loading with less axial fatigue than barbell squats.", suggestedRepRange: "8-20", suggestedRestRange: "120-180s", advancedMethodAllowed: false, alternatives: ["Hack Squat", "Belt Squats"] }),
  exercise({ name: "Hack Squat", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], movementPattern: "squat", equipment: ["machines"], difficultyLevel: "intermediate", experienceTier: "beginner", technicalDifficulty: 3, hypertrophyRating: 5, strengthRating: 4, stabilityRating: 5, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 4, jointFriendliness: 3, spinalLoading: "low", systemicFatigue: "high", jointStress: "moderate", notes: "Highly loadable quad exercise when knees tolerate it.", cautions: "Reduce range or substitute if knee pain appears.", suggestedRepRange: "6-15", suggestedRestRange: "120-180s", advancedMethodAllowed: false, alternatives: ["Leg Press", "Belt Squats"] }),
  exercise({ name: "Leg Extension", primaryMuscle: "Quads", secondaryMuscles: [], movementPattern: "knee extension", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "low", jointStress: "moderate", notes: "Low systemic fatigue quad isolation.", cautions: "Use pain-free range if knees are sensitive.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Leg Press", "Hack Squat"] }),
  exercise({ name: "Belt Squats", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], movementPattern: "squat", equipment: ["machines"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 3, hypertrophyRating: 5, strengthRating: 3, stabilityRating: 4, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "moderate", notes: "Advanced spine-sparing squat pattern for quad volume.", suggestedRepRange: "8-15", suggestedRestRange: "120-180s", advancedMethodAllowed: false, alternatives: ["Hack Squat", "Leg Press"] }),
  exercise({ name: "Bulgarian Split Squat", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Adductors"], movementPattern: "single-leg squat", equipment: ["dumbbells", "bodyweight"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 2, stabilityRating: 2, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 3, jointFriendliness: 3, spinalLoading: "low", systemicFatigue: "moderate", jointStress: "moderate", notes: "Great unilateral stimulus, but balance can limit loading.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Leg Press", "Hack Squat"] }),
  exercise({ name: "High Bar Squats", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Back"], movementPattern: "squat", equipment: ["barbell"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 5, hypertrophyRating: 4, strengthRating: 5, stabilityRating: 2, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 5, jointFriendliness: 3, spinalLoading: "high", systemicFatigue: "high", jointStress: "moderate", notes: "Advanced high-fatigue squat pattern; useful only when recovery supports it.", cautions: "Do not stack near deadlift or stiff-legged deadlift work.", suggestedRepRange: "5-10", suggestedRestRange: "150-180s", advancedMethodAllowed: false, alternatives: ["Hack Squat", "Leg Press", "Belt Squats"] }),
  exercise({ name: "Romanian Deadlift", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back"], movementPattern: "hinge", equipment: ["barbell", "dumbbells"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 4, hypertrophyRating: 5, strengthRating: 4, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 4, jointFriendliness: 4, spinalLoading: "moderate", systemicFatigue: "high", jointStress: "moderate", notes: "High hamstring tension in a loaded stretch; manage fatigue carefully.", cautions: "Stop if low-back pain replaces hamstring tension.", suggestedRepRange: "6-12", suggestedRestRange: "150-180s", advancedMethodAllowed: false, alternatives: ["Seated Leg Curl", "Lying Leg Curl"] }),
  exercise({ name: "Stiff-Legged Deadlifts", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back"], movementPattern: "hinge", equipment: ["barbell"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 5, hypertrophyRating: 5, strengthRating: 4, stabilityRating: 2, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 5, jointFriendliness: 3, spinalLoading: "high", systemicFatigue: "high", jointStress: "moderate", notes: "Advanced lengthened hamstring movement with high spinal fatigue.", cautions: "Do not place near another high spinal-loading day.", suggestedRepRange: "6-10", suggestedRestRange: "150-180s", advancedMethodAllowed: false, alternatives: ["Romanian Deadlift", "Seated Leg Curl"] }),
  exercise({ name: "Seated Leg Curl", primaryMuscle: "Hamstrings", secondaryMuscles: [], movementPattern: "knee flexion", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 5, strengthRating: 2, stabilityRating: 5, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Excellent hamstring isolation with long-muscle-length tension.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Lying Leg Curl", "Romanian Deadlift"] }),
  exercise({ name: "Lying Leg Curl", primaryMuscle: "Hamstrings", secondaryMuscles: [], movementPattern: "knee flexion", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 4, strengthRating: 2, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Low-fatigue hamstring curl for recoverable volume.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Seated Leg Curl", "Romanian Deadlift"] }),
  exercise({ name: "Hip Thrust", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], movementPattern: "hip extension", equipment: ["barbell", "machines"], difficultyLevel: "all", experienceTier: "intermediate", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 3, stabilityRating: 4, rangeOfMotion: 3, rangeOfMotionRating: 3, fatigueCost: 2, jointFriendliness: 4, spinalLoading: "low", systemicFatigue: "moderate", jointStress: "low", notes: "Loadable glute exercise with relatively low spinal fatigue.", suggestedRepRange: "8-15", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Bulgarian Split Squat", "Belt Squats"] }),
  exercise({ name: "Standing Calf Raise", primaryMuscle: "Calves", secondaryMuscles: [], movementPattern: "plantar flexion", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 4, strengthRating: 2, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Gastrocnemius-biased calf work with low systemic fatigue.", suggestedRepRange: "8-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Seated Calf Raise"] }),
  exercise({ name: "Seated Calf Raise", primaryMuscle: "Calves", secondaryMuscles: [], movementPattern: "plantar flexion", equipment: ["machines"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 4, strengthRating: 2, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Soleus-biased calf work that is easy to recover from.", suggestedRepRange: "10-25", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Standing Calf Raise"] }),
  exercise({ name: "Cable Curl", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], movementPattern: "elbow flexion", equipment: ["cables"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 5, strengthRating: 1, stabilityRating: 4, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Consistent tension and easy progression for biceps.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Preacher Curl", "Seated Incline Dumbbell Curls"] }),
  exercise({ name: "Preacher Curl", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], movementPattern: "elbow flexion", equipment: ["machines", "dumbbells", "ez bar"], difficultyLevel: "all", experienceTier: "intermediate", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 2, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Stable curl with strict execution.", suggestedRepRange: "8-15", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Curl", "Incline Dumbbell Curl"] }),
  exercise({ name: "Incline Dumbbell Curl", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], movementPattern: "elbow flexion", equipment: ["dumbbells"], difficultyLevel: "intermediate", experienceTier: "intermediate", technicalDifficulty: 3, hypertrophyRating: 5, strengthRating: 1, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Strong lengthened biceps stimulus when shoulders tolerate it.", suggestedRepRange: "8-15", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Curl", "Preacher Curl"] }),
  exercise({ name: "Dumbbell Lying Curls", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], movementPattern: "elbow flexion", equipment: ["dumbbells"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 5, strengthRating: 1, stabilityRating: 2, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "low", jointStress: "moderate", notes: "Advanced lengthened biceps isolation.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Curl", "Seated Incline Dumbbell Curls"] }),
  exercise({ name: "Seated Incline Dumbbell Curls", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], movementPattern: "elbow flexion", equipment: ["dumbbells"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 3, hypertrophyRating: 5, strengthRating: 1, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Advanced-friendly stretch-biased biceps work.", suggestedRepRange: "8-15", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Incline Dumbbell Curl", "Cable Curl"] }),
  exercise({ name: "Rope Pressdown", primaryMuscle: "Triceps", secondaryMuscles: [], movementPattern: "elbow extension", equipment: ["cables"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 4, strengthRating: 1, stabilityRating: 5, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Elbow-friendly triceps work with simple setup.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Overhead Cable Triceps Extension", "Barbell Skull Crushers"] }),
  exercise({ name: "Overhead Cable Triceps Extension", primaryMuscle: "Triceps", secondaryMuscles: [], movementPattern: "elbow extension", equipment: ["cables"], difficultyLevel: "all", experienceTier: "intermediate", technicalDifficulty: 2, hypertrophyRating: 5, strengthRating: 1, stabilityRating: 4, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Targets the long head in a lengthened position.", cautions: "Choose a shoulder position that feels natural and pain-free.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Rope Pressdown", "EZ Bar Behind-the-Neck Triceps Extensions"] }),
  exercise({ name: "Barbell Skull Crushers", primaryMuscle: "Triceps", secondaryMuscles: [], movementPattern: "elbow extension", equipment: ["barbell", "ez bar"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 2, stabilityRating: 3, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 2, spinalLoading: "none", systemicFatigue: "low", jointStress: "high", notes: "Advanced triceps option if elbows tolerate it.", cautions: "Avoid if elbows feel irritated.", suggestedRepRange: "8-15", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Rope Pressdown", "Overhead Cable Triceps Extension"] }),
  exercise({ name: "Dips", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], movementPattern: "dip", equipment: ["bodyweight"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 4, strengthRating: 4, stabilityRating: 2, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 3, jointFriendliness: 2, spinalLoading: "none", systemicFatigue: "moderate", jointStress: "high", notes: "Advanced pressing accessory only for pain-free shoulders and elbows.", cautions: "Substitute immediately if shoulder pain appears.", suggestedRepRange: "6-12", suggestedRestRange: "90-150s", advancedMethodAllowed: false, alternatives: ["Machine Chest Press", "Rope Pressdown"] }),
  exercise({ name: "EZ Bar Behind-the-Neck Triceps Extensions", primaryMuscle: "Triceps", secondaryMuscles: [], movementPattern: "elbow extension", equipment: ["ez bar"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 4, hypertrophyRating: 5, strengthRating: 2, stabilityRating: 3, rangeOfMotion: 5, rangeOfMotionRating: 5, fatigueCost: 2, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "low", jointStress: "moderate", notes: "Advanced long-head triceps work for pain-free shoulders.", suggestedRepRange: "8-15", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Overhead Cable Triceps Extension", "Rope Pressdown"] }),
  exercise({ name: "Cable Crunch", primaryMuscle: "Abs", secondaryMuscles: [], movementPattern: "spinal flexion", equipment: ["cables"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 2, hypertrophyRating: 4, strengthRating: 2, stabilityRating: 4, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "low", systemicFatigue: "low", jointStress: "low", notes: "Loadable ab training with easy progression.", suggestedRepRange: "10-20", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Plank", "Hanging Knee Raise"] }),
  exercise({ name: "Plank", primaryMuscle: "Abs", secondaryMuscles: [], movementPattern: "anti-extension", equipment: ["bodyweight"], difficultyLevel: "all", experienceTier: "beginner", technicalDifficulty: 1, hypertrophyRating: 2, strengthRating: 2, stabilityRating: 4, rangeOfMotion: 1, rangeOfMotionRating: 1, fatigueCost: 1, jointFriendliness: 5, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Beginner-friendly trunk control with low fatigue.", suggestedRepRange: "30-60 seconds", suggestedRestRange: "60-90s", advancedMethodAllowed: false, alternatives: ["Cable Crunch", "Hanging Knee Raise"] }),
  exercise({ name: "Hanging Knee Raise", primaryMuscle: "Abs", secondaryMuscles: ["Hip Flexors", "Forearms"], movementPattern: "hip flexion", equipment: ["bodyweight"], difficultyLevel: "intermediate", experienceTier: "beginner", technicalDifficulty: 3, hypertrophyRating: 3, strengthRating: 2, stabilityRating: 2, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 2, jointFriendliness: 3, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Useful trunk and hip-flexion challenge when grip is not limiting.", suggestedRepRange: "8-20", suggestedRestRange: "60-90s", advancedMethodAllowed: false, alternatives: ["Cable Crunch", "Plank"] }),
  exercise({ name: "Cable Wrist Curls", primaryMuscle: "Forearms", secondaryMuscles: [], movementPattern: "wrist flexion", equipment: ["cables"], difficultyLevel: "advanced", experienceTier: "advanced", technicalDifficulty: 2, hypertrophyRating: 3, strengthRating: 2, stabilityRating: 4, rangeOfMotion: 4, rangeOfMotionRating: 4, fatigueCost: 1, jointFriendliness: 4, spinalLoading: "none", systemicFatigue: "low", jointStress: "low", notes: "Advanced forearm isolation for users who want direct forearm work.", suggestedRepRange: "12-25", suggestedRestRange: "60-90s", advancedMethodAllowed: true, alternatives: ["Cable Curl"] })
];

export const defaultFitnessSettings: FitnessProgrammingSettings = {
  preferredSplit: "upper/lower",
  trainingDays: 4,
  mesocycleLength: 4,
  defaultRirProgression: [3, 2, 2, 1],
  defaultMinSets: 2,
  defaultMaxSets: 4,
  preferredExercises: [],
  favoriteExercises: [],
  blockedExercises: [],
  painfulExercises: [],
  allowAdvancedExercises: false,
  allowMyoReps: false,
  allowLengthenedPartials: false,
  allowBarbellCompounds: true,
  allowHighSpinalLoading: false,
  weakMusclePriorities: [],
  useAbVariation: true,
  preferredProgressionStyle: "double progression",
  deloadTriggerSensitivity: "moderate"
};

const volumeZones: Record<ExperienceLevel, Record<string, [number, number, number]>> = {
  beginner: {
    Chest: [6, 8, 10],
    Back: [6, 9, 12],
    Shoulders: [4, 7, 10],
    "Rear Delts": [4, 6, 8],
    Biceps: [4, 6, 8],
    Triceps: [4, 6, 8],
    Quads: [6, 8, 10],
    Hamstrings: [4, 6, 8],
    Glutes: [4, 6, 8],
    Calves: [4, 6, 8],
    Abs: [4, 6, 8],
    Forearms: [2, 4, 6]
  },
  intermediate: {
    Chest: [8, 11, 14],
    Back: [8, 12, 14],
    Shoulders: [6, 9, 12],
    "Rear Delts": [6, 9, 12],
    Biceps: [6, 8, 12],
    Triceps: [6, 8, 12],
    Quads: [8, 11, 14],
    Hamstrings: [6, 9, 12],
    Glutes: [6, 8, 12],
    Calves: [6, 9, 12],
    Abs: [6, 8, 10],
    Forearms: [4, 6, 8]
  },
  advanced: {
    Chest: [10, 14, 20],
    Back: [10, 16, 20],
    Shoulders: [8, 12, 16],
    "Rear Delts": [8, 12, 16],
    Biceps: [8, 12, 16],
    Triceps: [8, 12, 16],
    Quads: [10, 14, 20],
    Hamstrings: [8, 12, 16],
    Glutes: [8, 12, 16],
    Calves: [8, 12, 16],
    Abs: [8, 10, 14],
    Forearms: [6, 8, 12]
  }
};

function normalizeList(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function lowerSet(values?: string[]) {
  return new Set(normalizeList(values).map((value) => value.toLowerCase()));
}

function mergeSettings(settings?: ProgramSettingsInput): FitnessProgrammingSettings {
  return {
    ...defaultFitnessSettings,
    ...settings,
    preferredExercises: normalizeList(settings?.preferredExercises ?? defaultFitnessSettings.preferredExercises),
    favoriteExercises: normalizeList(settings?.favoriteExercises ?? defaultFitnessSettings.favoriteExercises),
    blockedExercises: normalizeList(settings?.blockedExercises ?? defaultFitnessSettings.blockedExercises),
    painfulExercises: normalizeList(settings?.painfulExercises ?? defaultFitnessSettings.painfulExercises),
    weakMusclePriorities: normalizeList(settings?.weakMusclePriorities ?? defaultFitnessSettings.weakMusclePriorities),
    defaultRirProgression: settings?.defaultRirProgression?.length ? settings.defaultRirProgression : defaultFitnessSettings.defaultRirProgression
  };
}

function profileWithDefaults(profile?: Partial<FitnessProfileInput>): FitnessProfileInput {
  const base = profile ?? fitnessProfile;
  return {
    ...fitnessProfile,
    ...base,
    trainingExperience: base.trainingExperience ?? fitnessProfile.trainingExperience,
    primaryGoal: base.primaryGoal ?? fitnessProfile.primaryGoal,
    daysAvailablePerWeek: base.daysAvailablePerWeek ?? fitnessProfile.daysAvailablePerWeek,
    preferredWorkoutDuration: base.preferredWorkoutDuration ?? fitnessProfile.preferredWorkoutDuration,
    availableEquipment: normalizeList(base.availableEquipment ?? fitnessProfile.availableEquipment),
    weakMuscleGroups: normalizeList(base.weakMuscleGroups ?? fitnessProfile.weakMuscleGroups),
    preferredSplit: (base.preferredSplit ?? fitnessProfile.preferredSplit) as FitnessProfileInput["preferredSplit"],
    sleepAverage: base.sleepAverage ?? fitnessProfile.sleepAverage,
    stressLevel: base.stressLevel ?? fitnessProfile.stressLevel,
    recoveryQuality: base.recoveryQuality ?? fitnessProfile.recoveryQuality,
    strengthNumbers: base.strengthNumbers ?? fitnessProfile.strengthNumbers,
    preferredExercises: normalizeList(base.preferredExercises),
    favoriteExercises: normalizeList(base.favoriteExercises),
    blockedExercises: normalizeList(base.blockedExercises),
    painfulExercises: normalizeList(base.painfulExercises),
    allowAdvancedExercises: base.allowAdvancedExercises ?? false,
    allowMyoReps: base.allowMyoReps ?? false,
    allowLengthenedPartials: base.allowLengthenedPartials ?? false,
    allowBarbellCompounds: base.allowBarbellCompounds ?? true,
    allowHighSpinalLoadingExercises: base.allowHighSpinalLoadingExercises ?? false,
    preferredProgressionStyle: base.preferredProgressionStyle ?? "double progression"
  };
}

function normalizedEquipment(equipment: string[]) {
  const expanded = equipment.flatMap((item) => equipmentAliases[item.toLowerCase()] ?? [item.toLowerCase()]);
  return new Set(expanded);
}

function includesName(set: Set<string>, name: string) {
  return set.has(name.toLowerCase());
}

function isIsolation(exercise: CuratedExercise) {
  return isolationPatterns.has(exercise.movementPattern);
}

function experienceAllowed(exercise: CuratedExercise, profile: FitnessProfileInput, settings: FitnessProgrammingSettings) {
  if (exercise.experienceTier === "all") return true;
  if (exercise.experienceTier === "beginner") return true;
  if (exercise.experienceTier === "intermediate") return profile.trainingExperience !== "beginner";
  return profile.trainingExperience === "advanced" || profile.allowAdvancedExercises || settings.allowAdvancedExercises;
}

function equipmentAllowed(exercise: CuratedExercise, equipment: Set<string>) {
  return exercise.equipment.some((item) => equipment.has(item.toLowerCase())) || exercise.equipment.includes("bodyweight");
}

function fatigueAllowed(exercise: CuratedExercise, profile: FitnessProfileInput, settings: FitnessProgrammingSettings, avoidHighSpinalLoading?: boolean) {
  if (!settings.allowBarbellCompounds && exercise.equipment.includes("barbell")) return false;
  if (profile.allowBarbellCompounds === false && exercise.equipment.includes("barbell")) return false;
  const highSpinalBlocked = !settings.allowHighSpinalLoading || profile.allowHighSpinalLoadingExercises === false || avoidHighSpinalLoading;
  if (highSpinalBlocked && exercise.spinalLoading === "high") return false;
  if (profile.trainingExperience === "beginner" && exercise.technicalDifficulty >= 4) return false;
  return true;
}

function exerciseScore({
  exercise,
  profile,
  settings,
  preferred,
  favorite,
  painful,
  blocked,
  targetMuscle,
  avoidHighSpinalLoading
}: {
  exercise: CuratedExercise;
  profile: FitnessProfileInput;
  settings: FitnessProgrammingSettings;
  preferred: Set<string>;
  favorite: Set<string>;
  painful: Set<string>;
  blocked: Set<string>;
  targetMuscle: string;
  avoidHighSpinalLoading?: boolean;
}) {
  const equipment = normalizedEquipment(profile.availableEquipment);
  if (!equipmentAllowed(exercise, equipment)) return -100;
  if (!experienceAllowed(exercise, profile, settings)) return -100;
  if (!fatigueAllowed(exercise, profile, settings, avoidHighSpinalLoading)) return -100;
  if (includesName(blocked, exercise.name) || includesName(painful, exercise.name)) return -100;

  const weakMuscles = lowerSet([...profile.weakMuscleGroups, ...settings.weakMusclePriorities]);
  const preferenceBonus = includesName(preferred, exercise.name) ? 5 : 0;
  const favoriteBonus = includesName(favorite, exercise.name) ? 3 : 0;
  const weakBonus = weakMuscles.has(targetMuscle.toLowerCase()) ? 2 : 0;
  const recoveryPenalty = profile.recoveryQuality <= 4 || profile.sleepAverage < 6.5 || profile.stressLevel >= 8 ? exercise.fatigueCost * 0.8 : 0;
  const technicalPenalty = profile.trainingExperience === "beginner" ? exercise.technicalDifficulty * 0.8 : exercise.technicalDifficulty * 0.25;
  const spinalPenalty = avoidHighSpinalLoading && ["moderate", "high"].includes(exercise.spinalLoading) ? 2 : 0;
  const experienceFitBonus =
    profile.trainingExperience === "beginner"
      ? exercise.experienceTier === "beginner" || exercise.experienceTier === "all"
        ? 1
        : 0
      : profile.trainingExperience === "intermediate"
        ? exercise.experienceTier === "intermediate"
          ? 3
          : 0
        : exercise.experienceTier === "advanced"
          ? 3
          : exercise.experienceTier === "intermediate"
            ? 1.5
            : 0;

  return (
    exercise.hypertrophyRating * 2.2 +
    exercise.stabilityRating +
    exercise.rangeOfMotionRating +
    exercise.jointFriendliness +
    experienceFitBonus +
    preferenceBonus +
    favoriteBonus +
    weakBonus -
    exercise.fatigueCost * 0.85 -
    recoveryPenalty -
    technicalPenalty -
    spinalPenalty
  );
}

function chooseExercise(
  slot: DayBlueprint["slots"][number],
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  usedNames: Set<string>
) {
  const preferred = lowerSet([...settings.preferredExercises, ...(profile.preferredExercises ?? [])]);
  const favorite = lowerSet([...settings.favoriteExercises, ...(profile.favoriteExercises ?? [])]);
  const painful = lowerSet([...settings.painfulExercises, ...(profile.painfulExercises ?? [])]);
  const blocked = lowerSet([...settings.blockedExercises, ...(profile.blockedExercises ?? [])]);

  return curatedExerciseLibrary
    .filter((exercise) => exercise.primaryMuscle === slot.primaryMuscle)
    .filter((exercise) => slot.movementPatterns.includes(exercise.movementPattern))
    .filter((exercise) => !usedNames.has(exercise.name))
    .map((exercise) => ({
      exercise,
      score: exerciseScore({
        exercise,
        profile,
        settings,
        preferred,
        favorite,
        painful,
        blocked,
        targetMuscle: slot.primaryMuscle,
        avoidHighSpinalLoading: slot.avoidHighSpinalLoading
      })
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.exercise;
}

function recommendedSplit(profile: FitnessProfileInput): PreferredSplit {
  if (profile.preferredSplit !== "custom") return profile.preferredSplit;
  if (profile.daysAvailablePerWeek <= 3) return "full body";
  if (profile.daysAvailablePerWeek === 4) return "upper/lower";
  if (profile.daysAvailablePerWeek === 5) return "hybrid";
  return "push/pull/legs";
}

function splitLabel(profile: FitnessProfileInput, split: PreferredSplit) {
  if (profile.trainingExperience === "beginner" && profile.daysAvailablePerWeek <= 3) return "Beginner 3-Day Full Body";
  if (profile.daysAvailablePerWeek === 4 && split === "upper/lower") return "Beginner/Intermediate 4-Day Upper/Lower";
  if (profile.trainingExperience === "intermediate" && profile.daysAvailablePerWeek === 6 && split === "push/pull/legs") {
    return "Intermediate High-Frequency PPL";
  }
  if (profile.trainingExperience === "advanced" && profile.daysAvailablePerWeek >= 6 && split === "push/pull/legs") {
    return "Advanced 6-Day Pull/Push/Legs";
  }
  if (profile.daysAvailablePerWeek === 5) return "Intermediate 5-Day Hybrid";
  return `${profile.trainingExperience} ${profile.daysAvailablePerWeek}-day ${split}`;
}

function upperA(): DayBlueprint {
  return {
    name: "Upper A",
    focusMuscles: ["Chest", "Back", "Shoulders", "Rear Delts", "Biceps", "Triceps"],
    fatigueLevel: "moderate",
    spinalLoading: "low",
    recoveryRole: "Horizontal push/pull emphasis with low spinal loading.",
    slots: [
      { primaryMuscle: "Chest", movementPatterns: ["horizontal press"] },
      { primaryMuscle: "Back", movementPatterns: ["horizontal pull"], avoidHighSpinalLoading: true },
      { primaryMuscle: "Shoulders", movementPatterns: ["shoulder abduction"], isolationPreferred: true },
      { primaryMuscle: "Rear Delts", movementPatterns: ["horizontal abduction"], isolationPreferred: true },
      { primaryMuscle: "Biceps", movementPatterns: ["elbow flexion"], isolationPreferred: true },
      { primaryMuscle: "Triceps", movementPatterns: ["elbow extension"], isolationPreferred: true }
    ]
  };
}

function upperB(): DayBlueprint {
  return {
    name: "Upper B",
    focusMuscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
    fatigueLevel: "moderate",
    spinalLoading: "low",
    recoveryRole: "Different chest angle and vertical pull variation for A/B stimulus.",
    slots: [
      { primaryMuscle: "Chest", movementPatterns: ["incline press", "fly"] },
      { primaryMuscle: "Back", movementPatterns: ["vertical pull"] },
      { primaryMuscle: "Back", movementPatterns: ["horizontal pull"], avoidHighSpinalLoading: true },
      { primaryMuscle: "Shoulders", movementPatterns: ["shoulder abduction"], isolationPreferred: true },
      { primaryMuscle: "Triceps", movementPatterns: ["elbow extension"], isolationPreferred: true },
      { primaryMuscle: "Biceps", movementPatterns: ["elbow flexion"], isolationPreferred: true }
    ]
  };
}

function lowerA(): DayBlueprint {
  return {
    name: "Lower A",
    focusMuscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Abs"],
    fatigueLevel: "high",
    spinalLoading: "moderate",
    recoveryRole: "Hard quad and hamstring day with one major lower-body loading slot.",
    slots: [
      { primaryMuscle: "Quads", movementPatterns: ["squat"] },
      { primaryMuscle: "Hamstrings", movementPatterns: ["hinge", "knee flexion"] },
      { primaryMuscle: "Calves", movementPatterns: ["plantar flexion"], isolationPreferred: true },
      { primaryMuscle: "Abs", movementPatterns: ["spinal flexion", "anti-extension", "hip flexion"], isolationPreferred: true }
    ]
  };
}

function lowerB(spineSparing = true): DayBlueprint {
  return {
    name: "Lower B",
    focusMuscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Abs"],
    fatigueLevel: "moderate",
    spinalLoading: spineSparing ? "low" : "moderate",
    recoveryRole: "Spine-sparing lower day to reduce overlap with pull and hinge work.",
    slots: [
      { primaryMuscle: "Quads", movementPatterns: ["squat", "single-leg squat"], avoidHighSpinalLoading: spineSparing },
      { primaryMuscle: "Hamstrings", movementPatterns: ["knee flexion"], avoidHighSpinalLoading: true },
      { primaryMuscle: "Glutes", movementPatterns: ["hip extension", "single-leg squat"], avoidHighSpinalLoading: true },
      { primaryMuscle: "Calves", movementPatterns: ["plantar flexion"], isolationPreferred: true },
      { primaryMuscle: "Abs", movementPatterns: ["spinal flexion", "anti-extension", "hip flexion"], isolationPreferred: true }
    ]
  };
}

function pullA(afterLegs = false): DayBlueprint {
  return {
    name: "Pull A",
    focusMuscles: ["Back", "Rear Delts", "Biceps", "Forearms"],
    fatigueLevel: "moderate",
    spinalLoading: "low",
    recoveryRole: "Vertical pull focus with supported rowing to preserve lower-back recovery.",
    slots: [
      { primaryMuscle: "Back", movementPatterns: ["vertical pull"] },
      { primaryMuscle: "Back", movementPatterns: ["horizontal pull"], avoidHighSpinalLoading: afterLegs },
      { primaryMuscle: "Rear Delts", movementPatterns: ["horizontal abduction"], isolationPreferred: true },
      { primaryMuscle: "Biceps", movementPatterns: ["elbow flexion"], isolationPreferred: true },
      { primaryMuscle: "Forearms", movementPatterns: ["wrist flexion"], isolationPreferred: true }
    ]
  };
}

function pullB(afterLegs = true): DayBlueprint {
  return {
    name: "Pull B",
    focusMuscles: ["Back", "Rear Delts", "Biceps", "Forearms"],
    fatigueLevel: "moderate",
    spinalLoading: "low",
    recoveryRole: "Horizontal row focus; high spinal-loading rows are filtered when recovery overlap is likely.",
    slots: [
      { primaryMuscle: "Back", movementPatterns: ["horizontal pull"], avoidHighSpinalLoading: afterLegs },
      { primaryMuscle: "Back", movementPatterns: ["vertical pull"] },
      { primaryMuscle: "Rear Delts", movementPatterns: ["horizontal abduction"], isolationPreferred: true },
      { primaryMuscle: "Biceps", movementPatterns: ["elbow flexion"], isolationPreferred: true },
      { primaryMuscle: "Forearms", movementPatterns: ["wrist flexion"], isolationPreferred: true }
    ]
  };
}

function pushA(): DayBlueprint {
  return {
    name: "Push A",
    focusMuscles: ["Chest", "Shoulders", "Triceps"],
    fatigueLevel: "moderate",
    spinalLoading: "none",
    recoveryRole: "Incline chest and triceps focus with low systemic fatigue accessories.",
    slots: [
      { primaryMuscle: "Chest", movementPatterns: ["incline press"] },
      { primaryMuscle: "Chest", movementPatterns: ["horizontal press", "fly"] },
      { primaryMuscle: "Triceps", movementPatterns: ["elbow extension"], isolationPreferred: true },
      { primaryMuscle: "Shoulders", movementPatterns: ["shoulder abduction"], isolationPreferred: true }
    ]
  };
}

function pushB(): DayBlueprint {
  return {
    name: "Push B",
    focusMuscles: ["Shoulders", "Chest", "Triceps"],
    fatigueLevel: "moderate",
    spinalLoading: "low",
    recoveryRole: "Shoulder and volume focus with chest isolation and triceps work.",
    slots: [
      { primaryMuscle: "Shoulders", movementPatterns: ["vertical press", "shoulder abduction"] },
      { primaryMuscle: "Chest", movementPatterns: ["fly", "horizontal press"] },
      { primaryMuscle: "Triceps", movementPatterns: ["elbow extension", "dip"], isolationPreferred: true },
      { primaryMuscle: "Shoulders", movementPatterns: ["shoulder abduction"], isolationPreferred: true }
    ]
  };
}

function fullBody(name: string, variant: number): DayBlueprint {
  return {
    name,
    focusMuscles: ["Chest", "Back", "Quads", "Hamstrings", "Shoulders", "Abs"],
    fatigueLevel: "moderate",
    spinalLoading: "low",
    recoveryRole: "Stable full-body exposure with recoverable per-session volume.",
    slots: [
      { primaryMuscle: "Chest", movementPatterns: variant === 1 ? ["horizontal press"] : ["incline press", "horizontal press"] },
      { primaryMuscle: "Back", movementPatterns: variant === 2 ? ["horizontal pull"] : ["vertical pull"], avoidHighSpinalLoading: true },
      { primaryMuscle: "Quads", movementPatterns: ["squat"], avoidHighSpinalLoading: true },
      { primaryMuscle: "Hamstrings", movementPatterns: ["knee flexion"], avoidHighSpinalLoading: true },
      { primaryMuscle: "Shoulders", movementPatterns: ["shoulder abduction"], isolationPreferred: true },
      { primaryMuscle: "Abs", movementPatterns: ["spinal flexion", "anti-extension", "hip flexion"], isolationPreferred: true }
    ]
  };
}

function weakPoint(profile: FitnessProfileInput): DayBlueprint {
  const weak = normalizeList(profile.weakMuscleGroups);
  const priority = weak.length ? weak : ["Shoulders", "Back", "Calves"];
  return {
    name: "Weak-Point Day",
    focusMuscles: priority.slice(0, 4),
    fatigueLevel: "low",
    spinalLoading: "none",
    recoveryRole: "Low-fatigue priority work that avoids turning five days into a recovery problem.",
    slots: priority.slice(0, 4).map((primaryMuscle) => ({
      primaryMuscle,
      movementPatterns:
        primaryMuscle === "Back" ? ["vertical pull", "horizontal pull"] :
        primaryMuscle === "Chest" ? ["fly", "horizontal press"] :
        primaryMuscle === "Quads" ? ["knee extension", "squat"] :
        primaryMuscle === "Hamstrings" ? ["knee flexion"] :
        primaryMuscle === "Triceps" ? ["elbow extension"] :
        primaryMuscle === "Biceps" ? ["elbow flexion"] :
        primaryMuscle === "Calves" ? ["plantar flexion"] :
        primaryMuscle === "Abs" ? ["spinal flexion", "anti-extension"] :
        ["shoulder abduction", "horizontal abduction"],
      avoidHighSpinalLoading: true,
      isolationPreferred: true
    }))
  };
}

function buildTrainingBlueprints(profile: FitnessProfileInput, split: PreferredSplit): DayBlueprint[] {
  const days = profile.daysAvailablePerWeek;

  if (split === "full body" || days <= 3) {
    return [fullBody("Full Body A", 1), fullBody("Full Body B", 2), fullBody("Full Body C", 3)].slice(0, days);
  }

  if (split === "upper/lower" || days === 4) {
    return [upperA(), lowerA(), upperB(), lowerB(true)].slice(0, days);
  }

  if (split === "hybrid" || days === 5) {
    return [upperA(), lowerA(), pushA(), pullB(true), profile.recoveryQuality >= 7 ? lowerB(true) : weakPoint(profile)].slice(0, days);
  }

  if (profile.trainingExperience === "advanced") {
    return [pullA(false), pushA(), lowerA(), pullB(true), pushB(), lowerB(true)].slice(0, days);
  }

  return [pullA(false), pushA(), lowerA(), pullB(true), pushB(), lowerB(true)].slice(0, days);
}

function weeklyLayout(profile: FitnessProfileInput, blueprints: DayBlueprint[], templateName: string) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (templateName === "Beginner 3-Day Full Body") {
    return dayNames.map((day, index) => {
      const map = [0, -1, 1, -1, 2, -1, -1][index];
      return map >= 0
        ? { day, name: blueprints[map]?.name ?? "Training", training: true, focusMuscles: blueprints[map]?.focusMuscles ?? [] }
        : { day, name: "Rest", training: false, focusMuscles: [], note: "Recovery spacing for repeated full-body work." };
    });
  }

  if (templateName === "Beginner/Intermediate 4-Day Upper/Lower") {
    const map = [0, 1, -1, 2, 3, -1, -1];
    return dayNames.map((day, index) => {
      const item = map[index];
      return item >= 0
        ? { day, name: blueprints[item]?.name ?? "Training", training: true, focusMuscles: blueprints[item]?.focusMuscles ?? [] }
        : { day, name: "Rest", training: false, focusMuscles: [], note: "Built-in recovery between repeated muscle exposures." };
    });
  }

  if (templateName === "Intermediate 5-Day Hybrid") {
    const map = [0, 1, -1, 2, 3, 4, -1];
    return dayNames.map((day, index) => {
      const item = map[index];
      return item >= 0
        ? { day, name: blueprints[item]?.name ?? "Training", training: true, focusMuscles: blueprints[item]?.focusMuscles ?? [] }
        : { day, name: "Rest", training: false, focusMuscles: [], note: index === 2 ? "Midweek recovery before push/pull work." : "End-of-week recovery." };
    });
  }

  if (templateName === "Advanced 6-Day Pull/Push/Legs") {
    const map = [0, 1, 2, -1, 3, 4, 5];
    return dayNames.map((day, index) => {
      const item = map[index];
      return item >= 0
        ? { day, name: blueprints[item]?.name ?? "Training", training: true, focusMuscles: blueprints[item]?.focusMuscles ?? [] }
        : { day, name: "Rest", training: false, focusMuscles: [], note: "Rest day separates high-fatigue lower work from the second wave." };
    });
  }

  return dayNames.map((day, index) => {
    const blueprint = blueprints[index];
    return blueprint
      ? { day, name: blueprint.name, training: true, focusMuscles: blueprint.focusMuscles }
      : { day, name: "Rest", training: false, focusMuscles: [], note: "Weekly recovery day." };
  });
}

function targetVolume(profile: FitnessProfileInput, settings: FitnessProgrammingSettings, feedback?: Feedback): MuscleVolume[] {
  const weakMuscles = lowerSet([...profile.weakMuscleGroups, ...settings.weakMusclePriorities]);

  return allMuscles.map((muscle) => {
    const [mev, mav, mrv] = volumeZones[profile.trainingExperience][muscle];
    const isPriority = weakMuscles.has(muscle.toLowerCase());
    const major = majorMuscles.has(muscle);
    let plannedSets = mev;

    if (profile.recoveryQuality >= 7 && profile.sleepAverage >= 7 && profile.stressLevel <= 6) plannedSets += major ? 2 : 1;
    if (isPriority) plannedSets += profile.trainingExperience === "beginner" ? 1 : 2;
    if (profile.trainingExperience === "advanced" && profile.recoveryQuality >= 8) plannedSets += isPriority ? 2 : 1;
    if (profile.daysAvailablePerWeek >= 6 && profile.trainingExperience === "intermediate") plannedSets += isPriority ? 1 : 0;

    let recommendation = "Start near MEV, progress reps first, and add sets only when recovery and performance support it.";

    if (feedback?.jointPain || feedback?.performanceTrend === "dropped" || (feedback?.soreness ?? 0) >= 8) {
      plannedSets = Math.max(mev, plannedSets - 2);
      recommendation = "Reduce volume and choose joint-friendly substitutions. Do not push through pain.";
    } else if (feedback?.performanceTrend === "improved" && (feedback?.soreness ?? 5) <= 5 && (feedback?.recoveryQuality ?? 7) >= 7) {
      plannedSets = Math.min(mrv, plannedSets + 1);
      recommendation = "Add 1 set next week only if soreness and performance remain favorable.";
    }

    if (profile.sleepAverage < 6.5 || profile.stressLevel >= 8 || profile.recoveryQuality <= 4) {
      plannedSets = Math.max(mev, plannedSets - 1);
      recommendation = "Recovery is constrained; keep RIR conservative and avoid adding volume.";
    }

    return { muscle, mev, mav, mrv, plannedSets: Math.min(plannedSets, mrv), recommendation };
  });
}

function restSeconds(exercise: CuratedExercise) {
  if (exercise.spinalLoading === "high" || exercise.fatigueCost >= 5) return 180;
  if (exercise.fatigueCost >= 4) return 150;
  if (exercise.fatigueCost >= 3) return 120;
  if (isIsolation(exercise)) return 75;
  return 105;
}

function rirForWeek(profile: FitnessProfileInput, settings: FitnessProgrammingSettings, feedback?: Feedback) {
  const week = Math.max(1, Math.min(settings.mesocycleLength, 1));
  let target = settings.defaultRirProgression[week - 1] ?? 3;
  if (profile.trainingExperience === "beginner") target = Math.max(target, 2);
  if (feedback?.jointPain || feedback?.performanceTrend === "dropped" || (feedback?.recoveryQuality ?? 7) <= 4) target += 1;
  return Math.max(0, Math.min(4, target));
}

function setsForExercise(
  exercise: CuratedExercise,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  exposures: number,
  targetSets: number
) {
  const base = Math.ceil(targetSets / Math.max(1, exposures));
  const experienceCap = profile.trainingExperience === "beginner" ? 3 : profile.trainingExperience === "intermediate" ? 4 : 5;
  const fatigueCap = exercise.fatigueCost >= 4 ? 3 : experienceCap;
  const userCap = Math.max(settings.defaultMinSets, settings.defaultMaxSets);
  const weekOneCap =
    profile.trainingExperience === "beginner"
      ? 3
      : profile.trainingExperience === "intermediate"
        ? targetSets >= 12 && exercise.fatigueCost <= 2
          ? 4
          : 3
        : targetSets >= 14 && exercise.fatigueCost <= 3
          ? 4
          : 3;
  const cap = Math.min(experienceCap, fatigueCap, userCap, weekOneCap);
  const min = Math.min(settings.defaultMinSets, cap);
  return Math.max(min, Math.min(cap, base));
}

function advancedMethod(exercise: CuratedExercise, profile: FitnessProfileInput, settings: FitnessProgrammingSettings, feedback?: Feedback) {
  const fatiguePoor = feedback?.jointPain || (feedback?.recoveryQuality ?? profile.recoveryQuality) <= 4 || (feedback?.soreness ?? 0) >= 8;
  if (fatiguePoor || !exercise.advancedMethodAllowed || !isIsolation(exercise)) return undefined;

  if ((profile.allowMyoReps || settings.allowMyoReps) && profile.trainingExperience !== "beginner" && exercise.fatigueCost <= 2) {
    return "Optional myo-reps on the final set only if joints feel good.";
  }

  if ((profile.allowLengthenedPartials || settings.allowLengthenedPartials) && profile.trainingExperience === "advanced") {
    return "Optional lengthened partials after clean full-ROM reps.";
  }

  return undefined;
}

function buildRirProgression(settings: FitnessProgrammingSettings) {
  return Array.from({ length: settings.mesocycleLength }, (_, index) => {
    const week = index + 1;
    const rir = settings.defaultRirProgression[index] ?? Math.max(0, 4 - week);
    return {
      week,
      targetRir: week === 1 ? "around 3 RIR" : week === 2 ? "around 2 RIR" : week === 3 ? "around 1-2 RIR" : `${Math.max(0, rir)}-${Math.max(1, rir + 1)} RIR if recovery is good`,
      note:
        week === 1
          ? "Execution and baseline performance week near MEV."
          : week === settings.mesocycleLength
            ? "Push only if recovery is good; deload if fatigue markers are poor."
            : "Progress reps or a small amount of volume only when performance is stable or improving."
    };
  });
}

function unusedPreferredExercises(profile: FitnessProfileInput, settings: FitnessProgrammingSettings, used: Set<string>) {
  const blocked = lowerSet([...settings.blockedExercises, ...(profile.blockedExercises ?? [])]);
  const painful = lowerSet([...settings.painfulExercises, ...(profile.painfulExercises ?? [])]);
  const preferred = normalizeList([...settings.preferredExercises, ...(profile.preferredExercises ?? [])]);
  return preferred
    .filter((name) => !used.has(name))
    .map((name) => {
      const exercise = curatedExerciseLibrary.find((item) => item.name.toLowerCase() === name.toLowerCase());
      let reason = "It did not beat the selected exercise for this split, equipment, fatigue, or recovery context.";
      if (!exercise) reason = "It is not in the curated exercise library.";
      else if (blocked.has(exercise.name.toLowerCase())) reason = "It is blocked by your preferences.";
      else if (painful.has(exercise.name.toLowerCase())) reason = "It is marked painful or uncomfortable.";
      else if (exercise.spinalLoading === "high" && !(profile.allowHighSpinalLoadingExercises || settings.allowHighSpinalLoading)) reason = "High spinal-loading exercises are currently disabled.";
      else if (exercise.experienceTier === "advanced" && !(profile.trainingExperience === "advanced" || profile.allowAdvancedExercises || settings.allowAdvancedExercises)) reason = "It is advanced and advanced exercises are not enabled.";
      return { exercise: name, reason, alternatives: exercise?.alternatives ?? [] };
    });
}

export function generateWorkoutPlan(
  rawProfile?: Partial<FitnessProfileInput>,
  feedback?: Feedback,
  rawSettings?: ProgramSettingsInput
): GeneratedWorkoutPlan {
  const profile = profileWithDefaults(rawProfile);
  const settings = mergeSettings({
    ...rawSettings,
    preferredSplit: rawSettings?.preferredSplit ?? profile.preferredSplit,
    trainingDays: rawSettings?.trainingDays ?? profile.daysAvailablePerWeek,
    allowAdvancedExercises: rawSettings?.allowAdvancedExercises ?? profile.allowAdvancedExercises ?? false,
    allowMyoReps: rawSettings?.allowMyoReps ?? profile.allowMyoReps ?? false,
    allowLengthenedPartials: rawSettings?.allowLengthenedPartials ?? profile.allowLengthenedPartials ?? false,
    allowBarbellCompounds: rawSettings?.allowBarbellCompounds ?? profile.allowBarbellCompounds ?? true,
    allowHighSpinalLoading: rawSettings?.allowHighSpinalLoading ?? profile.allowHighSpinalLoadingExercises ?? false,
    preferredProgressionStyle: rawSettings?.preferredProgressionStyle ?? profile.preferredProgressionStyle ?? "double progression"
  });

  profile.daysAvailablePerWeek = settings.trainingDays || profile.daysAvailablePerWeek;
  const split = recommendedSplit({ ...profile, preferredSplit: settings.preferredSplit });
  const templateName = splitLabel(profile, split);
  const blueprints = buildTrainingBlueprints(profile, split).slice(0, profile.daysAvailablePerWeek);
  const volume = targetVolume(profile, settings, feedback);
  const exposures = new Map<string, number>();
  for (const blueprint of blueprints) {
    for (const slot of blueprint.slots) {
      exposures.set(slot.primaryMuscle, (exposures.get(slot.primaryMuscle) ?? 0) + 1);
    }
  }

  const usedExercises = new Set<string>();
  const planDays: PlanDay[] = blueprints.map((blueprint, index) => {
    const dayUsed = new Set<string>();
    const exercises = blueprint.slots.flatMap((slot): PlanExercise[] => {
      const selected = chooseExercise(slot, profile, settings, dayUsed);
      if (!selected) return [];
      dayUsed.add(selected.name);
      usedExercises.add(selected.name);

      const target = volume.find((item) => item.muscle === selected.primaryMuscle)?.plannedSets ?? 6;
      const sets = setsForExercise(selected, profile, settings, exposures.get(selected.primaryMuscle) ?? 1, target);
      const targetRir = rirForWeek(profile, settings, feedback);
      const method = advancedMethod(selected, profile, settings, feedback);
      const preferenceNote = [...(profile.preferredExercises ?? []), ...settings.preferredExercises].some(
        (name) => name.toLowerCase() === selected.name.toLowerCase()
      )
        ? " Preferred exercise used because it fits the split and recovery constraints."
        : "";

      return [
        {
          exerciseName: selected.name,
          primaryMuscle: selected.primaryMuscle,
          secondaryMuscles: selected.secondaryMuscles,
          movementPattern: selected.movementPattern,
          sets,
          repRange: selected.suggestedRepRange,
          targetRir,
          restSeconds: restSeconds(selected),
          rationale: `${selected.hypertrophyRating}/5 hypertrophy, stability ${selected.stabilityRating}/5, fatigue ${selected.fatigueCost}/5.${preferenceNote}`,
          advancedMethod: method,
          fatigueCost: selected.fatigueCost,
          spinalLoading: selected.spinalLoading,
          exerciseTier: selected.experienceTier
        }
      ];
    });

    return {
      dayIndex: index + 1,
      name: blueprint.name,
      focusMuscles: blueprint.focusMuscles,
      recoveryRole: blueprint.recoveryRole,
      fatigueLevel: blueprint.fatigueLevel,
      spinalLoading: blueprint.spinalLoading,
      exercises
    };
  });

  const actualVolume = volume.map((item) => ({
    ...item,
    plannedSets: planDays.reduce(
      (total, day) => total + day.exercises.filter((exercise) => exercise.primaryMuscle === item.muscle).reduce((sets, exercise) => sets + exercise.sets, 0),
      0
    )
  }));

  const warnings: string[] = [];
  if (profile.trainingExperience === "intermediate" && profile.daysAvailablePerWeek === 6) {
    warnings.push("Intermediate 6-day training is allowed, but it requires solid sleep, nutrition, and recovery. If recovery drops, reduce volume or switch to 4-5 days.");
  }
  if (profile.recoveryQuality <= 4 || profile.sleepAverage < 6.5 || profile.stressLevel >= 8) {
    warnings.push("Recovery markers are constrained. Keep extra RIR, avoid adding volume, and consider a lower-frequency template.");
  }
  if (feedback?.jointPain) {
    warnings.push("Joint pain reported: painful exercises should be substituted and volume reduced. Consult a qualified professional for persistent pain or injuries.");
  }

  const explanation = [
    `This is ${templateName} because you selected ${profile.trainingExperience} experience, ${profile.daysAvailablePerWeek} training days, and a ${split} preference.`,
    `${profile.trainingExperience === "intermediate" && profile.daysAvailablePerWeek === 6 ? "It uses higher frequency, not advanced-level volume, with controlled per-session sets." : "Weekly volume starts near MEV and only moves upward when recovery and performance support it."}`,
    "Exercise selection is curated and prioritized by equipment, experience tier, stimulus-to-fatigue, joint comfort, spinal loading, and your preferred exercises.",
    "Recovery spacing avoids hard same-muscle back-to-back training when possible, keeps high spinal-loading movements away from each other, and uses spine-sparing lower or row variations where overlap is likely.",
    `Progression style: ${settings.preferredProgressionStyle}. Add reps within the range first, then add load only when the top of the range is achieved at target RIR with good form.`,
    "If soreness, fatigue, joint pain, or performance drops, reduce volume, remove advanced methods, and consider a deload."
  ];

  return {
    name: `${templateName} - RP-inspired evidence-based hypertrophy programming`,
    split,
    templateName,
    mesocycleWeek: 1,
    days: planDays,
    volume: actualVolume,
    notes: [
      "Most hypertrophy work uses 5-30 reps with conservative RIR targets.",
      "No exercise is selected randomly; the generator uses a curated exercise library and user-specific filters.",
      "Painful or blocked exercises are excluded and should not be pushed through.",
      "Advanced methods are optional, mostly limited to isolation exercises, and removed when fatigue or joint pain is high."
    ],
    weeklyLayout: weeklyLayout(profile, blueprints, templateName),
    rirProgression: buildRirProgression(settings),
    explanation,
    warnings,
    unusedPreferredExercises: unusedPreferredExercises(profile, settings, usedExercises)
  };
}

export function adaptiveRecommendations(feedback: Feedback) {
  const recommendations: string[] = [];

  if (feedback.jointPain) {
    recommendations.push("Joint pain reported: reduce affected muscle volume and substitute toward a more joint-friendly movement. Do not push through pain.");
  }
  if (feedback.performanceTrend === "improved" && (feedback.soreness ?? 5) <= 5 && (feedback.recoveryQuality ?? 7) >= 7) {
    recommendations.push("Performance is improving with manageable soreness: consider adding 1 set to the target muscle next week.");
  }
  if (feedback.performanceTrend === "stable" && (feedback.recoveryQuality ?? 7) >= 6) {
    recommendations.push("Performance is stable and recovery is acceptable: maintain current volume and improve reps or execution quality.");
  }
  if (feedback.performanceTrend === "dropped" || (feedback.soreness ?? 0) >= 8 || (feedback.recoveryQuality ?? 10) <= 4) {
    recommendations.push("Recovery markers are poor: reduce volume, keep more RIR, and consider a deload if this persists across sessions.");
  }

  return recommendations.length ? recommendations : ["No major adjustment needed. Keep logging RIR, soreness, and joint comfort."];
}
