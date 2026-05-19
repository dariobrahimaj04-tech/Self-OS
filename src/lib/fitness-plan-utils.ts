import { curatedExerciseLibrary } from "@/lib/fitness-programming";
import type {
  FitnessProgrammingSettings,
  FitnessProfileInput,
  GeneratedWorkoutPlan,
  MuscleVolume,
  PlanDay,
  PlanExercise,
  PlanVersion,
  WeeklyAdjustmentRecommendation,
  WorkoutLogView
} from "@/lib/types";

export const muscleOptions = [
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
  "Forearms",
  "Other"
];

const majorMuscles = new Set(["Chest", "Back", "Quads", "Hamstrings", "Glutes", "Shoulders"]);
const legMuscles = new Set(["Quads", "Hamstrings", "Glutes"]);
const highFatigue = new Set(["moderate", "high"]);

const inferredMuscles: Array<[RegExp, string]> = [
  [/(chest|pec|press|fly|flye)/i, "Chest"],
  [/(pullover|pulldown|pull-up|pullup|row|lat|back)/i, "Back"],
  [/(lateral|raise|delt|shoulder|y-raise|upright)/i, "Shoulders"],
  [/(rear delt|face pull|reverse fly)/i, "Rear Delts"],
  [/(curl|preacher|bicep)/i, "Biceps"],
  [/(tricep|pressdown|skull|extension|pushdown)/i, "Triceps"],
  [/(squat|leg press|pendulum|quad|leg extension|hack)/i, "Quads"],
  [/(hamstring|leg curl|rdl|deadlift|hinge)/i, "Hamstrings"],
  [/(glute|hip thrust|kickback)/i, "Glutes"],
  [/(calf|calves)/i, "Calves"],
  [/(abs|crunch|plank|core|hanging leg)/i, "Abs"],
  [/(forearm|wrist)/i, "Forearms"]
];

export function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function clonePlan(plan: GeneratedWorkoutPlan): GeneratedWorkoutPlan {
  return JSON.parse(JSON.stringify(plan)) as GeneratedWorkoutPlan;
}

export function stripVersionHistory(plan: GeneratedWorkoutPlan): Omit<GeneratedWorkoutPlan, "versionHistory"> {
  const copy = clonePlan(plan);
  delete copy.versionHistory;
  return copy;
}

export function inferTargetMuscle(exerciseName: string) {
  const match = inferredMuscles.find(([pattern]) => pattern.test(exerciseName));
  return {
    muscle: match?.[1] ?? "Other",
    inferred: Boolean(match)
  };
}

export function curatedByName(name: string) {
  const normalized = normalizeName(name);
  return (
    curatedExerciseLibrary.find((exercise) => normalizeName(exercise.name) === normalized) ??
    curatedExerciseLibrary.find((exercise) => normalizeName(exercise.name).includes(normalized) || normalized.includes(normalizeName(exercise.name))) ??
    null
  );
}

export function isBlockedOrPainfulName(
  name: string,
  profile: FitnessProfileInput,
  settings?: FitnessProgrammingSettings | null
) {
  const normalized = normalizeName(name);
  const blocked = [...(profile.blockedExercises ?? []), ...(settings?.blockedExercises ?? [])].map(normalizeName);
  const painful = [...(profile.painfulExercises ?? []), ...(settings?.painfulExercises ?? [])].map(normalizeName);
  return blocked.includes(normalized) || painful.includes(normalized);
}

export function createPlanExercise(
  exerciseName: string,
  day?: PlanDay,
  profile?: FitnessProfileInput,
  settings?: FitnessProgrammingSettings | null,
  base?: Partial<PlanExercise>
) {
  const curated = curatedByName(exerciseName);
  const defaultRir = base?.targetRir ?? day?.exercises[0]?.targetRir ?? 3;
  const defaultSets = base?.sets ?? 3;

  if (curated) {
    return {
      exerciseName: curated.name,
      primaryMuscle: curated.primaryMuscle,
      secondaryMuscles: curated.secondaryMuscles,
      movementPattern: curated.movementPattern,
      sets: defaultSets,
      repRange: base?.repRange ?? curated.suggestedRepRange,
      targetRir: defaultRir,
      restSeconds: base?.restSeconds ?? (curated.fatigueCost >= 4 ? 150 : curated.fatigueCost >= 3 ? 120 : 75),
      rationale: base?.rationale ?? `${curated.hypertrophyRating}/5 hypertrophy, stability ${curated.stabilityRating}/5, fatigue ${curated.fatigueCost}/5.`,
      advancedMethod: curated.advancedMethodAllowed ? base?.advancedMethod : undefined,
      fatigueCost: curated.fatigueCost,
      spinalLoading: curated.spinalLoading,
      exerciseTier: curated.experienceTier,
      source: "curated" as const,
      isCustom: false,
      notes: base?.notes
    };
  }

  const inferred = inferTargetMuscle(exerciseName);
  const targetMuscle = base?.primaryMuscle ?? inferred.muscle;
  const customWarning = inferred.inferred
    ? undefined
    : "Target muscle could not be inferred. Defaulted to Other; edit it before relying on weekly volume totals.";

  return {
    exerciseName: exerciseName.trim(),
    primaryMuscle: targetMuscle,
    secondaryMuscles: [],
    movementPattern: base?.movementPattern ?? "custom",
    sets: defaultSets,
    repRange: base?.repRange ?? "8-15",
    targetRir: defaultRir,
    restSeconds: base?.restSeconds ?? 120,
    rationale:
      base?.rationale ??
      "Custom exercise for this program only. Ratings are not verified; use conservative loading and stop if pain appears.",
    fatigueCost: base?.fatigueCost ?? 3,
    spinalLoading: base?.spinalLoading ?? "low",
    exerciseTier: "all" as const,
    source: "custom" as const,
    isCustom: true,
    targetMuscleInferred: inferred.inferred,
    customWarning,
    hypertrophyRating: "unknown" as const,
    stabilityRating: "unknown" as const,
    technicalDifficulty: "moderate" as const,
    notes: base?.notes
  };
}

export function recomputePlanVolume(plan: GeneratedWorkoutPlan) {
  const totals = new Map<string, number>();
  for (const day of plan.days) {
    for (const exercise of day.exercises) {
      totals.set(exercise.primaryMuscle, (totals.get(exercise.primaryMuscle) ?? 0) + exercise.sets);
    }
  }

  const existing = new Map(plan.volume.map((item) => [item.muscle, item]));
  const nextVolume: MuscleVolume[] = muscleOptions.map((muscle) => {
    const previous = existing.get(muscle);
    return {
      muscle,
      mev: previous?.mev ?? (muscle === "Other" ? 0 : 4),
      mav: previous?.mav ?? (muscle === "Other" ? 0 : 8),
      mrv: previous?.mrv ?? (muscle === "Other" ? 0 : 12),
      plannedSets: totals.get(muscle) ?? 0,
      recommendation: previous?.recommendation ?? "Custom volume target. Keep conservative unless recovery and performance are clearly good."
    };
  });

  plan.volume = nextVolume.filter((item) => item.muscle !== "Other" || item.plannedSets > 0);
}

export function rebuildWeeklyLayout(plan: GeneratedWorkoutPlan, restIndex?: number) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = [...plan.days];
  const restSlot = typeof restIndex === "number" ? Math.max(0, Math.min(6, restIndex)) : Math.min(6, days.length);
  plan.weeklyLayout = dayNames.map((day, index) => {
    if (index === restSlot || !days.length) {
      return { day, name: "Rest", training: false, focusMuscles: [], note: "Recovery day." };
    }
    const next = days.shift();
    if (!next) return { day, name: "Rest", training: false, focusMuscles: [], note: "Recovery day." };
    return { day, name: next.name, training: true, focusMuscles: next.focusMuscles };
  });
}

export function renumberDays(plan: GeneratedWorkoutPlan) {
  plan.days = plan.days.map((day, index) => ({ ...day, dayIndex: index + 1 }));
}

function planDayByLayoutName(plan: GeneratedWorkoutPlan, name: string) {
  return plan.days.find((day) => normalizeName(day.name) === normalizeName(name));
}

function daySystemicFatigue(day?: PlanDay) {
  if (!day) return "low";
  if (day.fatigueLevel === "high") return "high";
  if (day.exercises.some((exercise) => (exercise.fatigueCost ?? 0) >= 4)) return "high";
  if (day.fatigueLevel === "moderate" || day.exercises.some((exercise) => (exercise.fatigueCost ?? 0) >= 3)) return "moderate";
  return "low";
}

function isLowerBackDemandingPull(day?: PlanDay) {
  if (!day) return false;
  const isPull = /pull|back|row/i.test(day.name) || day.focusMuscles.includes("Back");
  return isPull && day.exercises.some((exercise) => highFatigue.has(exercise.spinalLoading ?? "none"));
}

function hasHeavySquatOrHinge(day?: PlanDay) {
  return Boolean(day?.exercises.some((exercise) => /(squat|deadlift|hinge|rdl|leg press|hack|pendulum)/i.test(exercise.exerciseName)));
}

export function analyzeRecoveryWarnings(plan: GeneratedWorkoutPlan) {
  const warnings: string[] = [];
  const layout = (plan.weeklyLayout?.length ? plan.weeklyLayout : plan.days.map((day) => ({
    day: String(day.dayIndex),
    name: day.name,
    training: true,
    focusMuscles: day.focusMuscles
  }))).filter((day) => day.training);

  for (let index = 0; index < layout.length - 1; index += 1) {
    const currentLayout = layout[index];
    const nextLayout = layout[index + 1];
    if (!currentLayout.training || !nextLayout.training) continue;

    const currentDay = planDayByLayoutName(plan, currentLayout.name);
    const nextDay = planDayByLayoutName(plan, nextLayout.name);
    const overlap = currentLayout.focusMuscles.filter((muscle) => nextLayout.focusMuscles.includes(muscle) && majorMuscles.has(muscle));
    if (overlap.length && (daySystemicFatigue(currentDay) !== "low" || daySystemicFatigue(nextDay) !== "low")) {
      warnings.push(`${currentLayout.name} and ${nextLayout.name} train ${overlap.join(", ")} hard back-to-back. Consider inserting rest or moving one day.`);
    }

    const currentIsLegs = currentLayout.focusMuscles.some((muscle) => legMuscles.has(muscle));
    if (currentIsLegs && isLowerBackDemandingPull(nextDay)) {
      warnings.push(`${currentLayout.name} before ${nextLayout.name} may stack hard legs before a lower-back-demanding pull day.`);
    }

    if (currentDay?.spinalLoading === "high" && nextDay?.spinalLoading === "high") {
      warnings.push(`${currentLayout.name} and ${nextLayout.name} are both high spinal-loading days.`);
    }

    if (hasHeavySquatOrHinge(currentDay) && hasHeavySquatOrHinge(nextDay)) {
      warnings.push(`Heavy squat or hinge patterns are close together on ${currentLayout.name} and ${nextLayout.name}.`);
    }

    if (daySystemicFatigue(currentDay) === "high" && daySystemicFatigue(nextDay) === "high") {
      warnings.push(`Very high systemic fatigue is clustered on ${currentLayout.name} and ${nextLayout.name}.`);
    }
  }

  return Array.from(new Set(warnings));
}

export function refreshPlanAfterEdit(plan: GeneratedWorkoutPlan, summary: string[]) {
  renumberDays(plan);
  if (!plan.weeklyLayout?.length) rebuildWeeklyLayout(plan);
  recomputePlanVolume(plan);
  const recoveryWarnings = analyzeRecoveryWarnings(plan);
  plan.warnings = Array.from(new Set([...(plan.warnings ?? []), ...recoveryWarnings]));
  plan.lastChangeSummary = summary;
  return recoveryWarnings;
}

export function createVersionSnapshot(plan: GeneratedWorkoutPlan, label: string, summary: string[] = []) {
  const history = plan.versionHistory ?? [];
  const versionNumber = Math.max(0, ...history.map((item) => item.versionNumber)) + 1;
  const snapshot: PlanVersion = {
    versionNumber,
    timestamp: new Date().toISOString(),
    label,
    summary,
    plan: stripVersionHistory(plan)
  };
  return {
    ...plan,
    currentVersion: versionNumber,
    versionHistory: [...history, snapshot].slice(-25)
  };
}

export function ensureInitialVersion(plan: GeneratedWorkoutPlan) {
  if (plan.versionHistory?.length) return plan;
  return createVersionSnapshot(plan, "Initial generated plan", ["Baseline generated program."]);
}

export function restorePlanVersion(plan: GeneratedWorkoutPlan, version: PlanVersion, profile: FitnessProfileInput, settings?: FitnessProgrammingSettings | null) {
  const restored = clonePlan(version.plan as GeneratedWorkoutPlan);
  restored.days = restored.days.map((day) => ({
    ...day,
    exercises: day.exercises.filter((exercise) => {
      if (exercise.isCustom) return !isBlockedOrPainfulName(exercise.exerciseName, profile, settings);
      return !isBlockedOrPainfulName(exercise.exerciseName, profile, settings);
    })
  }));
  restored.versionHistory = plan.versionHistory ?? [];
  restored.currentVersion = plan.currentVersion;
  const removed = version.plan.days.reduce((count, day) => count + day.exercises.length, 0) - restored.days.reduce((count, day) => count + day.exercises.length, 0);
  const summary = [`Restored version ${version.versionNumber}: ${version.label}.`];
  if (removed > 0) summary.push(`Skipped ${removed} blocked or painful exercise${removed === 1 ? "" : "s"} during restore.`);
  refreshPlanAfterEdit(restored, summary);
  return createVersionSnapshot(restored, `Restored v${version.versionNumber}`, summary);
}

export function parseExecutionNotes(notes?: string | null) {
  if (!notes?.startsWith("SELFOS_EXECUTION:")) return null;
  try {
    return JSON.parse(notes.replace(/^SELFOS_EXECUTION:/, "")) as WorkoutLogView["execution"] & {
      notes?: string;
      feedback?: {
        pumpQuality?: number;
        targetMuscleFeel?: number;
        jointPain?: "none" | "mild" | "moderate" | "severe";
        sorenessExpected?: "low" | "moderate" | "high";
        sessionDifficulty?: number;
        performance?: "better" | "same" | "worse";
        recovery?: "good" | "okay" | "poor";
        notes?: string;
      };
    };
  } catch {
    return null;
  }
}

export function buildWeeklyAdjustmentRecommendations(plan: GeneratedWorkoutPlan, logs: WorkoutLogView[]) {
  const recent = logs.slice(0, 14);
  const recommendations: WeeklyAdjustmentRecommendation[] = [];
  const hasPoorRecovery = recent.some((log) => log.feedback?.recovery === "poor" || log.sessionDifficulty >= 9);
  const hasDeloadMarkers = recent.filter((log) => log.performanceTrend === "dropped" || log.feedback?.recovery === "poor").length >= 2;
  const painfulMuscles = new Set<string>();

  for (const log of recent) {
    if (log.feedback?.jointPain && log.feedback.jointPain !== "none") {
      for (const muscle of log.execution?.musclesTrained ?? []) painfulMuscles.add(muscle);
    }
  }

  for (const volume of plan.volume) {
    const muscleLogs = recent.filter((log) => log.execution?.musclesTrained?.includes(volume.muscle));
    const improved = muscleLogs.some((log) => log.performanceTrend === "improved" || log.feedback?.performance === "better");
    const dropped = muscleLogs.some((log) => log.performanceTrend === "dropped" || log.feedback?.performance === "worse");
    const highSoreness = muscleLogs.some((log) => log.feedback?.sorenessExpected === "high");
    const jointPain = painfulMuscles.has(volume.muscle);
    const candidate = plan.days.flatMap((day) => day.exercises).find((exercise) => exercise.primaryMuscle === volume.muscle);

    if (jointPain && candidate) {
      recommendations.push({
        id: `${volume.muscle}-pain`,
        muscle: volume.muscle,
        title: `${volume.muscle}: substitute painful movement`,
        recommendation: `Replace or reduce ${candidate.exerciseName} before adding volume.`,
        reason: `Joint pain was reported in recent ${volume.muscle} work. Do not push through pain.`,
        action: "replace_exercise",
        exerciseName: candidate.exerciseName,
        selected: true
      });
      continue;
    }

    if (hasDeloadMarkers && majorMuscles.has(volume.muscle)) {
      recommendations.push({
        id: `${volume.muscle}-deload`,
        muscle: volume.muscle,
        title: `${volume.muscle}: deload warning`,
        recommendation: "Use a lower-volume week and keep more RIR.",
        reason: "Multiple recovery markers were poor or performance dropped.",
        action: "deload",
        setDelta: -1,
        rirDelta: 1,
        selected: true
      });
      continue;
    }

    if (dropped || highSoreness || hasPoorRecovery || volume.plannedSets > volume.mrv) {
      recommendations.push({
        id: `${volume.muscle}-reduce`,
        muscle: volume.muscle,
        title: `${volume.muscle}: reduce stress`,
        recommendation: `Reduce ${volume.muscle} by 1 set or keep volume stable with more RIR.`,
        reason: dropped
          ? "Performance dropped in recent logs."
          : highSoreness
            ? "Soreness was high for this muscle."
            : volume.plannedSets > volume.mrv
              ? "Current volume is above estimated MRV."
              : "Recovery quality was poor.",
        action: "remove_set",
        setDelta: -1,
        selected: true
      });
      continue;
    }

    if (improved && volume.plannedSets < volume.mav && candidate) {
      recommendations.push({
        id: `${volume.muscle}-add`,
        muscle: volume.muscle,
        title: `${volume.muscle}: add one set`,
        recommendation: `Add 1 set to ${candidate.exerciseName} next week.`,
        reason: `${volume.muscle} performance improved and recovery did not show a poor marker. Volume is still below or near MAV.`,
        action: "add_set",
        exerciseName: candidate.exerciseName,
        setDelta: 1,
        selected: true
      });
      continue;
    }

    if (volume.plannedSets < volume.mev && !hasPoorRecovery && candidate) {
      recommendations.push({
        id: `${volume.muscle}-mev`,
        muscle: volume.muscle,
        title: `${volume.muscle}: below MEV`,
        recommendation: `Add 1 set to ${candidate.exerciseName} if recovery remains good.`,
        reason: `${volume.muscle} is below estimated MEV and no poor recovery marker was found.`,
        action: "add_set",
        exerciseName: candidate.exerciseName,
        setDelta: 1,
        selected: true
      });
      continue;
    }

    recommendations.push({
      id: `${volume.muscle}-maintain`,
      muscle: volume.muscle,
      title: `${volume.muscle}: maintain`,
      recommendation: "Maintain volume and progress reps or load slowly.",
      reason: "Performance and recovery do not justify adding or removing volume.",
      action: "maintain",
      selected: false
    });
  }

  return recommendations;
}

export function applyWeeklyAdjustments(plan: GeneratedWorkoutPlan, recommendations: WeeklyAdjustmentRecommendation[]) {
  const next = clonePlan(plan);
  const summary: string[] = [];

  for (const recommendation of recommendations.filter((item) => item.selected)) {
    if (recommendation.action === "maintain") continue;

    if (recommendation.action === "deload") {
      for (const day of next.days) {
        day.exercises = day.exercises.map((exercise) => ({
          ...exercise,
          sets: Math.max(1, exercise.sets - (majorMuscles.has(exercise.primaryMuscle) ? 1 : 0)),
          targetRir: Math.min(4, exercise.targetRir + 1)
        }));
      }
      summary.push("Applied lower-volume deload-style recommendations with more RIR.");
      continue;
    }

    const target = next.days.flatMap((day) => day.exercises).find((exercise) => {
      if (recommendation.exerciseName) return normalizeName(exercise.exerciseName) === normalizeName(recommendation.exerciseName);
      return exercise.primaryMuscle === recommendation.muscle;
    });
    if (!target) continue;

    if (recommendation.action === "add_set" && recommendation.setDelta) {
      const volume = next.volume.find((item) => item.muscle === recommendation.muscle);
      if (volume && volume.plannedSets >= volume.mrv) {
        summary.push(`Skipped ${recommendation.muscle} set increase because it is at or above MRV.`);
      } else {
        target.sets += recommendation.setDelta;
        summary.push(recommendation.recommendation);
      }
    }

    if (recommendation.action === "remove_set" && recommendation.setDelta) {
      target.sets = Math.max(1, target.sets + recommendation.setDelta);
      summary.push(recommendation.recommendation);
    }

    if (recommendation.action === "replace_exercise") {
      target.targetRir = Math.min(4, target.targetRir + 1);
      target.substitutionNote = "Joint pain was reported. Replace this movement or keep it conservative until pain-free.";
      summary.push(recommendation.recommendation);
    }
  }

  refreshPlanAfterEdit(next, summary);
  return createVersionSnapshot(next, "Applied weekly adjustment", summary.length ? summary : ["No selected weekly changes were applied."]);
}
