import { exerciseDatabase, fitnessProfile } from "./mock-data";
import type {
  ExerciseRecord,
  FitnessProfileInput,
  GeneratedWorkoutPlan,
  MuscleVolume,
  PlanDay
} from "./types";

const muscles = [
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

const volumeZones: Record<FitnessProfileInput["trainingExperience"], Record<string, [number, number, number]>> = {
  beginner: {
    Chest: [6, 10, 14],
    Back: [8, 12, 16],
    Shoulders: [4, 8, 12],
    "Rear Delts": [4, 8, 14],
    Biceps: [4, 8, 12],
    Triceps: [4, 8, 12],
    Quads: [6, 10, 14],
    Hamstrings: [4, 8, 12],
    Glutes: [4, 8, 12],
    Calves: [4, 8, 12],
    Abs: [4, 8, 12],
    Forearms: [2, 6, 10]
  },
  intermediate: {
    Chest: [8, 14, 20],
    Back: [10, 16, 22],
    Shoulders: [6, 12, 18],
    "Rear Delts": [6, 12, 20],
    Biceps: [6, 12, 18],
    Triceps: [6, 12, 18],
    Quads: [8, 14, 20],
    Hamstrings: [6, 12, 18],
    Glutes: [6, 12, 18],
    Calves: [6, 12, 18],
    Abs: [6, 10, 16],
    Forearms: [4, 8, 12]
  },
  advanced: {
    Chest: [10, 16, 24],
    Back: [12, 18, 26],
    Shoulders: [8, 14, 22],
    "Rear Delts": [8, 14, 22],
    Biceps: [8, 14, 22],
    Triceps: [8, 14, 22],
    Quads: [10, 16, 24],
    Hamstrings: [8, 14, 22],
    Glutes: [8, 14, 22],
    Calves: [8, 14, 22],
    Abs: [8, 12, 18],
    Forearms: [6, 10, 16]
  }
};

type Feedback = {
  performanceTrend?: "improved" | "stable" | "dropped";
  soreness?: number;
  jointPain?: boolean;
  recoveryQuality?: number;
};

function exerciseScore(exercise: ExerciseRecord, profile: FitnessProfileInput) {
  const equipmentMatch = exercise.equipment.some((item) => profile.availableEquipment.includes(item));
  if (!equipmentMatch) return -1;

  const goalBias = profile.primaryGoal === "strength" ? exercise.strengthRating : exercise.hypertrophyRating;
  const fatiguePenalty = exercise.fatigueCost * (profile.stressLevel >= 7 || profile.sleepAverage < 6.5 ? 1.25 : 0.8);
  const jointPenalty =
    profile.injuriesOrLimitations && exercise.jointFriendliness <= 3 ? 2 : 0;
  const weakMuscleBonus = profile.weakMuscleGroups.includes(exercise.primaryMuscle.toLowerCase()) ? 1 : 0;

  return (
    goalBias * 2 +
    exercise.stabilityRating +
    exercise.rangeOfMotion +
    exercise.jointFriendliness +
    weakMuscleBonus -
    fatiguePenalty -
    jointPenalty
  );
}

function bestExercisesFor(muscle: string, profile: FitnessProfileInput, count = 2) {
  return exerciseDatabase
    .filter((exercise) => exercise.primaryMuscle === muscle)
    .map((exercise) => ({ exercise, score: exerciseScore(exercise, profile) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.exercise);
}

function splitDays(profile: FitnessProfileInput) {
  if (profile.preferredSplit === "push/pull/legs" && profile.daysAvailablePerWeek >= 3) {
    return [
      ["Chest", "Shoulders", "Triceps"],
      ["Back", "Rear Delts", "Biceps", "Forearms"],
      ["Quads", "Hamstrings", "Glutes", "Calves", "Abs"],
      ["Chest", "Back", "Shoulders"]
    ].slice(0, profile.daysAvailablePerWeek);
  }

  if (profile.preferredSplit === "full body") {
    return Array.from({ length: profile.daysAvailablePerWeek }, () => [
      "Chest",
      "Back",
      "Quads",
      "Hamstrings",
      "Shoulders",
      "Abs"
    ]);
  }

  return [
    ["Chest", "Back", "Shoulders", "Rear Delts", "Biceps", "Triceps"],
    ["Quads", "Hamstrings", "Glutes", "Calves", "Abs"],
    ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
    ["Quads", "Hamstrings", "Glutes", "Calves", "Abs"],
    ["Back", "Shoulders", "Rear Delts", "Forearms"]
  ].slice(0, profile.daysAvailablePerWeek);
}

function targetVolume(profile: FitnessProfileInput, feedback?: Feedback): MuscleVolume[] {
  return muscles.map((muscle) => {
    const [mev, mav, mrv] = volumeZones[profile.trainingExperience][muscle];
    const weakBonus = profile.weakMuscleGroups.includes(muscle.toLowerCase()) ? 2 : 0;
    let plannedSets = Math.min(mrv, mav + weakBonus);
    let recommendation = "Maintain volume and progress load or reps when execution and RIR targets are stable.";

    if (feedback?.jointPain || feedback?.performanceTrend === "dropped" || (feedback?.soreness ?? 0) >= 8) {
      plannedSets = Math.max(mev, plannedSets - 2);
      recommendation = "Reduce volume this week and consider a joint-friendly substitution. Do not push through pain.";
    } else if (feedback?.performanceTrend === "improved" && (feedback?.soreness ?? 5) <= 5 && (feedback?.recoveryQuality ?? 7) >= 7) {
      plannedSets = Math.min(mrv, plannedSets + 1);
      recommendation = "Add 1 set if performance and soreness stay favorable after the next exposure.";
    }

    if (profile.sleepAverage < 6.5 || profile.stressLevel >= 8) {
      plannedSets = Math.max(mev, plannedSets - 1);
      recommendation = "Recovery is constrained; keep RIR conservative and avoid adding volume.";
    }

    return { muscle, mev, mav, mrv, plannedSets, recommendation };
  });
}

function repRange(profile: FitnessProfileInput, exercise: ExerciseRecord) {
  if (profile.primaryGoal === "strength" && ["horizontal press", "squat", "hinge"].includes(exercise.movementPattern)) {
    return "3-6";
  }
  return exercise.suggestedRepRange;
}

function restSeconds(profile: FitnessProfileInput, exercise: ExerciseRecord) {
  if (profile.primaryGoal === "strength" || exercise.fatigueCost >= 4) return 180;
  if (exercise.fatigueCost >= 3) return 120;
  return 75;
}

export function generateWorkoutPlan(
  profile: FitnessProfileInput = fitnessProfile,
  feedback?: Feedback
): GeneratedWorkoutPlan {
  const volume = targetVolume(profile, feedback);
  const setBudget = new Map(volume.map((item) => [item.muscle, item.plannedSets]));
  const days = splitDays(profile);

  const planDays: PlanDay[] = days.map((focusMuscles, dayIndex) => {
    const exercises = focusMuscles.flatMap((muscle) => {
      const selected = bestExercisesFor(muscle, profile, focusMuscles.length > 4 ? 1 : 2);
      const muscleBudget = setBudget.get(muscle) ?? 6;
      const setsPerExercise = Math.max(2, Math.min(4, Math.ceil(muscleBudget / Math.max(2, selected.length * 2))));

      return selected.map((exercise) => ({
        exerciseName: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        sets: setsPerExercise,
        repRange: repRange(profile, exercise),
        targetRir: profile.primaryGoal === "strength" ? 2 : dayIndex === 0 ? 3 : 2,
        restSeconds: restSeconds(profile, exercise),
        rationale: `${exercise.hypertrophyRating}/5 hypertrophy, ${exercise.stabilityRating}/5 stability, fatigue ${exercise.fatigueCost}/5.`
      }));
    });

    return {
      dayIndex: dayIndex + 1,
      name: `Day ${dayIndex + 1} - ${focusMuscles.slice(0, 3).join(" / ")}`,
      focusMuscles,
      exercises: exercises.slice(0, profile.preferredWorkoutDuration <= 45 ? 5 : 7)
    };
  });

  const notes = [
    "Most hypertrophy work is assigned in the 5-30 rep range with 0-4 RIR.",
    "Progress by adding reps first, then load, when form and target RIR are maintained.",
    "Deload if several markers are poor: sleep drops, soreness stays high, joints hurt, or performance declines.",
    "Pain triggers reduced volume or substitution. For injuries or persistent pain, consult a qualified professional."
  ];

  return {
    name: `${profile.primaryGoal} ${profile.preferredSplit} mesocycle`,
    split: profile.preferredSplit,
    mesocycleWeek: 1,
    days: planDays,
    volume,
    notes
  };
}

export function adaptiveRecommendations(feedback: Feedback) {
  const recommendations: string[] = [];

  if (feedback.jointPain) {
    recommendations.push("Joint pain reported: reduce affected muscle volume and substitute toward a more joint-friendly movement.");
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
