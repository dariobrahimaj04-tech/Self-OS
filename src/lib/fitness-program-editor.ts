import { curatedExerciseLibrary, defaultFitnessSettings, generateWorkoutPlan } from "@/lib/fitness-programming";
import {
  analyzeRecoveryWarnings,
  createPlanExercise,
  inferTargetMuscle,
  rebuildWeeklyLayout,
  refreshPlanAfterEdit,
  restorePlanVersion
} from "@/lib/fitness-plan-utils";
import type {
  FitnessProgrammingSettings,
  FitnessProfileInput,
  GeneratedWorkoutPlan,
  MuscleVolume,
  PlanDay,
  PlanExercise,
  PreferredSplit
} from "@/lib/types";

type ProgramEditInput = {
  request: string;
  plan: GeneratedWorkoutPlan;
  profile: FitnessProfileInput;
  settings?: FitnessProgrammingSettings | null;
};

export type ProgramEditResult = {
  draftPlan: GeneratedWorkoutPlan;
  summary: string[];
  changed: string[];
  refused: string[];
  warnings: string[];
  settingsPatch?: Partial<FitnessProgrammingSettings>;
  profilePatch?: Partial<FitnessProfileInput>;
};

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
  "Forearms",
  "Other"
];

const muscleAliases: Record<string, string> = {
  chest: "Chest",
  pecs: "Chest",
  back: "Back",
  lats: "Back",
  shoulders: "Shoulders",
  delts: "Shoulders",
  "side delts": "Shoulders",
  "lateral delts": "Shoulders",
  "rear delts": "Rear Delts",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  quad: "Quads",
  hamstrings: "Hamstrings",
  hamstring: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  calf: "Calves",
  abs: "Abs",
  core: "Abs",
  forearms: "Forearms",
  other: "Other"
};

const exerciseAliases: Record<string, string> = {
  "leg press": "Leg Press",
  "hack squat": "Hack Squat",
  "skull crushers": "Barbell Skull Crushers",
  "skull crusher": "Barbell Skull Crushers",
  "stiff legged deadlift": "Stiff-Legged Deadlifts",
  "stiff-legged deadlift": "Stiff-Legged Deadlifts",
  "rdl": "Romanian Deadlift",
  "lat pulldown": "Lat Pulldown",
  "cable lateral raise": "Cable Lateral Raise",
  dips: "Dips"
};

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

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clonePlan(plan: GeneratedWorkoutPlan): GeneratedWorkoutPlan {
  return JSON.parse(JSON.stringify(plan)) as GeneratedWorkoutPlan;
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function cleanExerciseRequestName(value: string) {
  return value
    .replace(/^this custom exercise:?\s*/i, "")
    .replace(/^custom exercise:?\s*/i, "")
    .replace(/\s+as a custom exercise\b/gi, "")
    .replace(/\s+even if it is not in the library\b/gi, "")
    .trim();
}

function withDefaultSettings(settings?: FitnessProgrammingSettings | null): FitnessProgrammingSettings {
  return {
    ...defaultFitnessSettings,
    ...(settings ?? {}),
    preferredExercises: settings?.preferredExercises ?? defaultFitnessSettings.preferredExercises,
    favoriteExercises: settings?.favoriteExercises ?? defaultFitnessSettings.favoriteExercises,
    blockedExercises: settings?.blockedExercises ?? defaultFitnessSettings.blockedExercises,
    painfulExercises: settings?.painfulExercises ?? defaultFitnessSettings.painfulExercises,
    weakMusclePriorities: settings?.weakMusclePriorities ?? defaultFitnessSettings.weakMusclePriorities
  };
}

function findExercise(value: string) {
  const normalized = normalize(value);
  const alias = Object.entries(exerciseAliases).find(([key]) => normalized.includes(key))?.[1];
  if (alias) return curatedExerciseLibrary.find((exercise) => exercise.name === alias) ?? null;

  const matches = curatedExerciseLibrary
    .map((exercise) => ({ exercise, name: normalize(exercise.name) }))
    .filter(({ name }) => normalized.includes(name) || name.includes(normalized))
    .sort((a, b) => b.name.length - a.name.length);

  return matches[0]?.exercise ?? null;
}

function findExercisesInText(value: string) {
  const normalized = normalize(value);
  const byAlias = Object.entries(exerciseAliases)
    .filter(([key]) => normalized.includes(key))
    .map(([, name]) => name);
  const byLibrary = curatedExerciseLibrary
    .filter((exercise) => normalized.includes(normalize(exercise.name)))
    .map((exercise) => exercise.name);
  return uniqueList([...byAlias, ...byLibrary])
    .map((name) => curatedExerciseLibrary.find((exercise) => exercise.name === name))
    .filter((exercise): exercise is (typeof curatedExerciseLibrary)[number] => Boolean(exercise));
}

function findMusclesInText(value: string) {
  const normalized = normalize(value);
  return uniqueList(
    Object.entries(muscleAliases)
      .filter(([alias]) => normalized.includes(alias))
      .map(([, muscle]) => muscle)
  );
}

function isBlockedOrPainful(name: string, profile: FitnessProfileInput, settings: FitnessProgrammingSettings, settingsPatch: Partial<FitnessProgrammingSettings>) {
  const normalized = normalize(name);
  const blocked = [...(profile.blockedExercises ?? []), ...settings.blockedExercises, ...(settingsPatch.blockedExercises ?? [])].map(normalize);
  const painful = [...(profile.painfulExercises ?? []), ...settings.painfulExercises, ...(settingsPatch.painfulExercises ?? [])].map(normalize);
  return blocked.includes(normalized) || painful.includes(normalized);
}

function canUseExercise(
  exercise: (typeof curatedExerciseLibrary)[number],
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  settingsPatch: Partial<FitnessProgrammingSettings>
) {
  if (isBlockedOrPainful(exercise.name, profile, settings, settingsPatch)) return false;
  if (exercise.spinalLoading === "high" && !(profile.allowHighSpinalLoadingExercises || settings.allowHighSpinalLoading)) return false;
  if (exercise.experienceTier === "advanced" && !(profile.trainingExperience === "advanced" || profile.allowAdvancedExercises || settings.allowAdvancedExercises)) return false;
  const available = new Set(profile.availableEquipment.map(normalize));
  return exercise.equipment.some((item) => available.has(normalize(item))) || exercise.equipment.includes("bodyweight");
}

function isIsolation(exercise: PlanExercise) {
  return exercise.movementPattern ? isolationPatterns.has(exercise.movementPattern) : false;
}

function restFor(exercise: (typeof curatedExerciseLibrary)[number]) {
  if (exercise.spinalLoading === "high" || exercise.fatigueCost >= 5) return 180;
  if (exercise.fatigueCost >= 4) return 150;
  if (exercise.fatigueCost >= 3) return 120;
  if (isolationPatterns.has(exercise.movementPattern)) return 75;
  return 105;
}

function exerciseToPlanExercise(
  current: PlanExercise,
  replacement: (typeof curatedExerciseLibrary)[number],
  reason: string
): PlanExercise {
  return {
    ...current,
    exerciseName: replacement.name,
    primaryMuscle: replacement.primaryMuscle,
    secondaryMuscles: replacement.secondaryMuscles,
    movementPattern: replacement.movementPattern,
    repRange: replacement.suggestedRepRange,
    restSeconds: Math.max(current.restSeconds, restFor(replacement)),
    rationale: `${reason} ${replacement.hypertrophyRating}/5 hypertrophy, stability ${replacement.stabilityRating}/5, fatigue ${replacement.fatigueCost}/5.`,
    fatigueCost: replacement.fatigueCost,
    spinalLoading: replacement.spinalLoading,
    exerciseTier: replacement.experienceTier,
    advancedMethod: replacement.advancedMethodAllowed ? current.advancedMethod : undefined
  };
}

function safeAlternative(
  exercise: (typeof curatedExerciseLibrary)[number],
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  settingsPatch: Partial<FitnessProgrammingSettings>
) {
  const alternatives = exercise.alternatives
    .map((name) => curatedExerciseLibrary.find((item) => item.name === name))
    .filter((item): item is (typeof curatedExerciseLibrary)[number] => Boolean(item));
  const fallback = curatedExerciseLibrary.filter(
    (item) =>
      item.name !== exercise.name &&
      item.primaryMuscle === exercise.primaryMuscle &&
      item.movementPattern === exercise.movementPattern
  );
  return [...alternatives, ...fallback]
    .filter((item) => canUseExercise(item, profile, settings, settingsPatch))
    .sort((a, b) => b.hypertrophyRating + b.stabilityRating - b.fatigueCost - (a.hypertrophyRating + a.stabilityRating - a.fatigueCost))[0] ?? null;
}

function recomputeVolume(plan: GeneratedWorkoutPlan) {
  const totals = new Map<string, number>();
  for (const day of plan.days) {
    for (const exercise of day.exercises) {
      totals.set(exercise.primaryMuscle, (totals.get(exercise.primaryMuscle) ?? 0) + exercise.sets);
    }
  }
  plan.volume = plan.volume.map((item) => ({ ...item, plannedSets: totals.get(item.muscle) ?? 0 }));
}

function findDay(plan: GeneratedWorkoutPlan, value?: string | null) {
  if (!value) return null;
  const normalized = normalize(value);
  const exact = plan.days.find((day) => normalize(day.name) === normalized);
  if (exact) return exact;
  return (
    plan.days.find((day) => normalized.includes(normalize(day.name)) || normalize(day.name).includes(normalized)) ??
    plan.days.find((day) => day.name.split(/\s+/).every((part) => normalized.includes(normalize(part)))) ??
    null
  );
}

function findBestDayForExercise(plan: GeneratedWorkoutPlan, exercise: PlanExercise, requestedDay?: string | null) {
  const explicit = findDay(plan, requestedDay);
  if (explicit) return explicit;
  return (
    plan.days.find((day) => day.focusMuscles.includes(exercise.primaryMuscle)) ??
    plan.days.find((day) => /custom|weak|upper/i.test(day.name)) ??
    plan.days[0] ??
    null
  );
}

function findPlanExercise(plan: GeneratedWorkoutPlan, value: string) {
  const normalized = normalize(value);
  const all = plan.days.flatMap((day) => day.exercises.map((exercise) => ({ day, exercise })));
  return (
    all.find(({ exercise }) => normalize(exercise.exerciseName) === normalized) ??
    all.find(({ exercise }) => normalized.includes(normalize(exercise.exerciseName)) || normalize(exercise.exerciseName).includes(normalized)) ??
    null
  );
}

function addExerciseToPlan(
  plan: GeneratedWorkoutPlan,
  exerciseName: string,
  dayName: string | null,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  result: ProgramEditResult
) {
  const cleanName = cleanExerciseRequestName(exerciseName);
  if (!cleanName) return;
  if (isBlockedOrPainful(cleanName, profile, settings, result.settingsPatch ?? {})) {
    result.refused.push(`Did not add ${cleanName} because it is blocked or marked painful. Do not push through pain.`);
    return;
  }

  const exercise = createPlanExercise(cleanName, undefined, profile, settings);
  const targetDay = findBestDayForExercise(plan, exercise, dayName);
  if (!targetDay) {
    result.refused.push(`Could not add ${cleanName}; no workout day is available in the draft plan.`);
    return;
  }
  if (targetDay.exercises.some((item) => normalize(item.exerciseName) === normalize(exercise.exerciseName))) {
    return;
  }

  targetDay.exercises = [...targetDay.exercises, exercise];
  targetDay.focusMuscles = uniqueList([...targetDay.focusMuscles, exercise.primaryMuscle]);
  if (exercise.isCustom) {
    const inferred = inferTargetMuscle(cleanName);
    result.changed.push(`Added custom exercise ${exercise.exerciseName} to ${targetDay.name}.`);
    if (!inferred.inferred) result.warnings.push(`${exercise.exerciseName} target muscle could not be inferred, so it was set to Other.`);
  } else {
    result.changed.push(`Added curated exercise ${exercise.exerciseName} to ${targetDay.name}.`);
  }
  recomputeVolume(plan);
}

function replaceExercise(
  plan: GeneratedWorkoutPlan,
  fromName: string,
  toName: string,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  settingsPatch: Partial<FitnessProgrammingSettings>,
  result: ProgramEditResult
) {
  const current = findPlanExercise(plan, fromName);
  const cleanToName = cleanExerciseRequestName(toName);
  const to = findExercise(cleanToName);
  const customReplacement = !to
    ? createPlanExercise(cleanToName, current?.day, profile, settings, current?.exercise
      ? {
          sets: current.exercise.sets,
          repRange: current.exercise.repRange,
          targetRir: current.exercise.targetRir,
          restSeconds: current.exercise.restSeconds,
          notes: current.exercise.notes
        }
      : undefined)
    : null;
  if (!current) {
    result.refused.push(`Could not find "${fromName}" in the current draft plan.`);
    return;
  }
  if (to && !canUseExercise(to, profile, settings, settingsPatch)) {
    result.refused.push(`Did not use ${to.name} because it is blocked, painful, too advanced, unavailable, or violates spinal-loading settings.`);
    return;
  }
  if (!to && isBlockedOrPainful(cleanToName, profile, settings, settingsPatch)) {
    result.refused.push(`Did not use ${cleanToName} because it is blocked or marked painful. Do not push through pain.`);
    return;
  }

  let count = 0;
  plan.days = plan.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => {
      if (normalize(exercise.exerciseName) !== normalize(current.exercise.exerciseName)) return exercise;
      count += 1;
      return to
        ? exerciseToPlanExercise(exercise, to, `Edited from ${current.exercise.exerciseName} by Program Change Request.`)
        : {
            ...(customReplacement as PlanExercise),
            sets: exercise.sets,
            repRange: exercise.repRange,
            targetRir: exercise.targetRir,
            restSeconds: exercise.restSeconds,
            notes: exercise.notes
          };
    })
  }));

  if (count === 0) {
    result.refused.push(`${current.exercise.exerciseName} is not currently in the draft plan, so it was not replaced.`);
    return;
  }

  result.changed.push(`Replaced ${current.exercise.exerciseName} with ${to?.name ?? customReplacement?.exerciseName ?? toName} in ${count} place${count === 1 ? "" : "s"}.`);
  if (customReplacement?.isCustom && customReplacement.customWarning) result.warnings.push(customReplacement.customWarning);
  recomputeVolume(plan);
}

function removeExercise(plan: GeneratedWorkoutPlan, exerciseName: string, result: ProgramEditResult) {
  const target = findPlanExercise(plan, exerciseName);
  if (!target) {
    result.refused.push(`Could not remove "${exerciseName}" because it is not in the current draft plan.`);
    return;
  }

  let count = 0;
  plan.days = plan.days.map((day) => {
    const nextExercises = day.exercises.filter((item) => {
      const keep = normalize(item.exerciseName) !== normalize(target.exercise.exerciseName);
      if (!keep) count += 1;
      return keep;
    });
    return { ...day, exercises: nextExercises };
  });

  if (count) {
    result.changed.push(`Removed ${target.exercise.exerciseName} from ${count} place${count === 1 ? "" : "s"}.`);
    recomputeVolume(plan);
  } else {
    result.refused.push(`${target.exercise.exerciseName} is not currently in the draft plan.`);
  }
}

function markPainfulAndSubstitute(
  plan: GeneratedWorkoutPlan,
  exerciseName: string,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  settingsPatch: Partial<FitnessProgrammingSettings>,
  result: ProgramEditResult
) {
  const exercise = findExercise(exerciseName);
  if (!exercise) {
    const custom = findPlanExercise(plan, exerciseName);
    if (!custom) {
      result.refused.push(`Could not find "${exerciseName}" in the current draft plan to mark it painful.`);
      return;
    }
    settingsPatch.painfulExercises = uniqueList([...(settingsPatch.painfulExercises ?? settings.painfulExercises), custom.exercise.exerciseName]);
    settingsPatch.blockedExercises = uniqueList([...(settingsPatch.blockedExercises ?? settings.blockedExercises), custom.exercise.exerciseName]);
    custom.day.exercises = custom.day.exercises.filter((item) => normalize(item.exerciseName) !== normalize(custom.exercise.exerciseName));
    result.changed.push(`Marked custom exercise ${custom.exercise.exerciseName} as painful/blocked for this draft and removed it. Do not push through joint pain.`);
    recomputeVolume(plan);
    return;
  }

  settingsPatch.painfulExercises = uniqueList([...(settingsPatch.painfulExercises ?? settings.painfulExercises), exercise.name]);
  settingsPatch.blockedExercises = uniqueList([...(settingsPatch.blockedExercises ?? settings.blockedExercises), exercise.name]);
  result.changed.push(`Marked ${exercise.name} as painful/blocked for this draft. Do not push through joint pain.`);

  const alternative = safeAlternative(exercise, profile, settings, settingsPatch);
  let count = 0;
  plan.days = plan.days.map((day) => ({
    ...day,
    exercises: day.exercises.flatMap((item) => {
      if (normalize(item.exerciseName) !== normalize(exercise.name)) return [item];
      count += 1;
      return alternative ? [exerciseToPlanExercise(item, alternative, `Substituted because ${exercise.name} was marked painful.`)] : [];
    })
  }));

  if (count && alternative) result.changed.push(`Substituted ${exercise.name} with ${alternative.name}.`);
  if (count && !alternative) result.warnings.push(`Removed ${exercise.name}; no safe curated alternative fit your current equipment and settings.`);
  recomputeVolume(plan);
}

function adjustMuscleVolume(plan: GeneratedWorkoutPlan, muscle: string, delta: number, result: ProgramEditResult) {
  const volume = plan.volume.find((item) => item.muscle === muscle);
  const before = volume?.plannedSets ?? plan.days.reduce((total, day) => total + day.exercises.filter((exercise) => exercise.primaryMuscle === muscle).reduce((sets, exercise) => sets + exercise.sets, 0), 0);
  let remaining = Math.abs(delta);

  const candidates = plan.days
    .flatMap((day) => day.exercises.filter((exercise) => exercise.primaryMuscle === muscle))
    .sort((a, b) => (a.fatigueCost ?? 2) - (b.fatigueCost ?? 2));

  if (!candidates.length) {
    result.refused.push(`No ${muscle} exercises are currently available in the draft plan to adjust.`);
    return;
  }

  while (remaining > 0) {
    const changed = candidates.find((exercise) => (delta > 0 ? exercise.sets < 4 && (exercise.fatigueCost ?? 2) <= 3 : exercise.sets > 1));
    if (!changed) break;
    changed.sets += delta > 0 ? 1 : -1;
    remaining -= 1;
  }

  recomputeVolume(plan);
  const after = plan.volume.find((item) => item.muscle === muscle)?.plannedSets ?? before;
  if (after === before) {
    result.refused.push(`Could not ${delta > 0 ? "increase" : "reduce"} ${muscle} volume without violating set caps or dropping exercises too low.`);
    return;
  }

  result.changed.push(`${delta > 0 ? "Increased" : "Reduced"} ${muscle} weekly sets from ${before} to ${after}.`);
  const nextVolume = plan.volume.find((item) => item.muscle === muscle);
  if (nextVolume && after < nextVolume.mev) result.warnings.push(`${muscle} is now below estimated MEV (${nextVolume.mev}). Monitor performance and recovery.`);
  if (nextVolume && after > nextVolume.mrv) result.warnings.push(`${muscle} is above estimated MRV (${nextVolume.mrv}); this may become junk volume.`);
}

function parseVolumeChanges(text: string, result: ProgramEditResult, plan: GeneratedWorkoutPlan) {
  const sentences = text.split(/[.!?\n]+/).map((sentence) => sentence.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const normalized = normalize(sentence);
    if (!/(set|volume|more|increase|raise|add|lower|reduce|decrease|drop)/.test(normalized)) continue;
    const foundMuscles = findMusclesInText(sentence);
    if (!foundMuscles.length) continue;
    const amount = Number.parseInt(normalized.match(/(\d+)\s*sets?/)?.[1] ?? "2", 10);
    const direction = /(lower|reduce|decrease|drop|less)/.test(normalized) ? -1 : /(add|increase|raise|more)/.test(normalized) ? 1 : 0;
    if (!direction) continue;
    for (const muscle of foundMuscles) adjustMuscleVolume(plan, muscle, direction * amount, result);
  }
}

function applySplitChange(
  text: string,
  plan: GeneratedWorkoutPlan,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  result: ProgramEditResult
) {
  const normalized = normalize(text);
  let split: PreferredSplit | null = null;
  let days: number | null = null;

  if (/intermediate high frequency ppl|6 day ppl|six day ppl|6 day push pull legs/.test(normalized)) {
    split = "push/pull/legs";
    days = 6;
  } else if (/upper lower|upper\/lower/.test(text.toLowerCase())) {
    split = "upper/lower";
    days = 4;
  } else if (/full body/.test(normalized)) {
    split = "full body";
    days = 3;
  } else if (/hybrid/.test(normalized)) {
    split = "hybrid";
    days = 5;
  }

  if (!split || !days) return plan;

  const profilePatch: Partial<FitnessProfileInput> = {
    daysAvailablePerWeek: days,
    preferredSplit: split
  };
  const settingsPatch: Partial<FitnessProgrammingSettings> = {
    trainingDays: days,
    preferredSplit: split
  };
  result.profilePatch = { ...(result.profilePatch ?? {}), ...profilePatch };
  result.settingsPatch = { ...(result.settingsPatch ?? {}), ...settingsPatch };
  result.changed.push(`Changed split request to ${days}-day ${split}.`);
  if (profile.trainingExperience === "intermediate" && days === 6 && split === "push/pull/legs") {
    result.changed.push("Labeled as Intermediate High-Frequency PPL without automatically raising volume to advanced levels.");
  }

  return generateWorkoutPlan({ ...profile, ...profilePatch }, undefined, { ...settings, ...settingsPatch });
}

function applyRestChanges(text: string, plan: GeneratedWorkoutPlan, result: ProgramEditResult) {
  const normalized = normalize(text);
  if (/longer rest|increase rest/.test(normalized) && /compound|heavy/.test(normalized)) {
    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        if (!isIsolation(exercise)) exercise.restSeconds = Math.max(exercise.restSeconds, exercise.primaryMuscle === "Quads" || exercise.primaryMuscle === "Hamstrings" || exercise.spinalLoading === "high" ? 180 : 150);
      }
    }
    result.changed.push("Increased rest times for heavy compound movements.");
  }

  if (/isolation/.test(normalized) && /60|90|rest/.test(normalized)) {
    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        if (isIsolation(exercise)) exercise.restSeconds = 75;
      }
    }
    result.changed.push("Set isolation exercise rest times inside the 60-90 second range.");
  }

  if (/big leg|heavy leg|leg movement|2 3 minutes|2 to 3 minutes/.test(normalized)) {
    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        if (["Quads", "Hamstrings", "Glutes"].includes(exercise.primaryMuscle) && !isIsolation(exercise)) exercise.restSeconds = Math.max(exercise.restSeconds, 150);
      }
    }
    result.changed.push("Set big lower-body movements to roughly 2-3 minutes of rest.");
  }
}

function applyRirChanges(text: string, plan: GeneratedWorkoutPlan, profile: FitnessProfileInput, result: ProgramEditResult) {
  const normalized = normalize(text);
  const explicitRir = normalized.match(/week 1.*?([0-4])\s*rir/)?.[1];
  if (explicitRir) {
    const value = Number.parseInt(explicitRir, 10);
    plan.days = plan.days.map((day) => ({ ...day, exercises: day.exercises.map((exercise) => ({ ...exercise, targetRir: value })) }));
    plan.rirProgression = (plan.rirProgression ?? []).map((item) => item.week === 1 ? { ...item, targetRir: `around ${value} RIR` } : item);
    result.changed.push(`Set Week 1 target intensity to around ${value} RIR.`);
  }

  if (/less intense|easier|more conservative/.test(normalized)) {
    plan.days = plan.days.map((day) => ({ ...day, exercises: day.exercises.map((exercise) => ({ ...exercise, targetRir: Math.min(4, exercise.targetRir + 1) })) }));
    result.changed.push("Made the draft less intense by adding roughly 1 RIR.");
  }

  if (/closer to failure|more intense|harder/.test(normalized)) {
    if (profile.recoveryQuality <= 5) result.warnings.push("Recovery is not high; closer-to-failure work should be used sparingly.");
    plan.days = plan.days.map((day) => ({ ...day, exercises: day.exercises.map((exercise) => ({ ...exercise, targetRir: Math.max(0, exercise.targetRir - 1) })) }));
    result.changed.push("Moved the draft closer to failure by reducing target RIR by roughly 1.");
  }
}

function applyRecoveryChanges(text: string, plan: GeneratedWorkoutPlan, result: ProgramEditResult) {
  const normalized = normalize(text);
  const wantsRecovery = /recovery friendly|avoid high spinal|spinal loading|don t put legs before pull|dont put legs before pull|legs before pull|high fatigue pull/.test(normalized);
  if (!wantsRecovery) return;

  for (const day of plan.days) {
    for (const exercise of day.exercises) {
      if (exercise.spinalLoading === "high") {
        exercise.sets = Math.max(1, exercise.sets - 1);
        exercise.targetRir = Math.min(4, exercise.targetRir + 1);
      }
    }
  }

  if (plan.days.length >= 6 && plan.days.some((day) => day.name.includes("Legs")) && plan.days.some((day) => day.name.includes("Pull"))) {
    const [pullA, pushA, legsA, pullB, pushB, legsB] = plan.days;
    plan.weeklyLayout = [
      { day: "Mon", name: pullA?.name ?? "Pull A", training: true, focusMuscles: pullA?.focusMuscles ?? ["Back"] },
      { day: "Tue", name: pushA?.name ?? "Push A", training: true, focusMuscles: pushA?.focusMuscles ?? ["Chest"] },
      { day: "Wed", name: legsA?.name ?? "Legs A", training: true, focusMuscles: legsA?.focusMuscles ?? ["Quads", "Hamstrings"] },
      { day: "Thu", name: "Rest", training: false, focusMuscles: [], note: "Recovery buffer before the second pull day." },
      { day: "Fri", name: pullB?.name ?? "Pull B", training: true, focusMuscles: pullB?.focusMuscles ?? ["Back"] },
      { day: "Sat", name: pushB?.name ?? "Push B", training: true, focusMuscles: pushB?.focusMuscles ?? ["Chest", "Shoulders"] },
      { day: "Sun", name: legsB?.name ?? "Legs B", training: true, focusMuscles: legsB?.focusMuscles ?? ["Quads", "Hamstrings"] }
    ];
    result.changed.push("Added a recovery-aware weekly layout with rest after Legs A before Pull B.");
  }

  result.changed.push("Made the draft more recovery-friendly by reducing high-spinal-loading stress where present.");
  result.warnings.push("SelfOS will not recommend pushing through joint pain. Persistent pain or injury should be discussed with a qualified professional.");
  recomputeVolume(plan);
}

function applyJunkVolumeRules(text: string, plan: GeneratedWorkoutPlan, result: ProgramEditResult) {
  const normalized = normalize(text);
  if (!/junk volume|near mev|closer to mev|4 sets to everything|four sets to everything/.test(normalized)) return;

  for (const day of plan.days) {
    for (const exercise of day.exercises) {
      if (exercise.sets > 3) exercise.sets = 3;
    }
  }

  recomputeVolume(plan);
  result.changed.push("Capped Week 1 exercise prescriptions at 3 sets where needed to keep the plan closer to MEV and avoid junk volume.");
  for (const volume of plan.volume) {
    if (volume.plannedSets < volume.mev) result.warnings.push(`${volume.muscle} is below estimated MEV after the junk-volume pass.`);
  }
}

function applyReplacementRequests(
  text: string,
  plan: GeneratedWorkoutPlan,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  result: ProgramEditResult
) {
  const settingsPatch = result.settingsPatch ?? {};
  const replacementPattern = /(?:replace|swap)\s+(.+?)\s+(?:with|for)\s+(.+?)(?=[.!?\n]|$)/gi;
  for (const match of text.matchAll(replacementPattern)) {
    replaceExercise(plan, match[1], match[2], profile, settings, settingsPatch, result);
  }

  const removePattern = /(?:remove|don'?t include|do not include)\s+(.+?)(?=[.!?\n]|$)/gi;
  for (const match of text.matchAll(removePattern)) {
    removeExercise(plan, match[1], result);
  }
}

function applyAddExerciseRequests(
  text: string,
  plan: GeneratedWorkoutPlan,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  result: ProgramEditResult
) {
  const addPattern = /(?:add|include)\s+(.+?)(?:\s+to\s+([A-Za-z][A-Za-z\s-]*?))?(?=[.!?\n]|$)/gi;
  for (const match of text.matchAll(addPattern)) {
    const rawExercise = match[1].trim();
    if (!rawExercise || /set|volume|rir|rest|day|week|order|recommendation/i.test(rawExercise)) continue;
    addExerciseToPlan(plan, rawExercise, match[2]?.trim() ?? null, profile, settings, result);
  }

  const customPattern = /custom exercise:?\s+(.+?)(?=[.!?\n]|$)/gi;
  for (const match of text.matchAll(customPattern)) {
    addExerciseToPlan(plan, match[1], null, profile, settings, result);
  }
}

function dayType(day: PlanDay) {
  const value = normalize(day.name);
  if (/pull|back/.test(value)) return "pull";
  if (/push|chest|shoulder/.test(value)) return "push";
  if (/leg|lower/.test(value)) return "legs";
  if (/upper/.test(value)) return "upper";
  if (/full/.test(value)) return "full";
  return value.split(" ")[0] ?? value;
}

function moveDay(plan: GeneratedWorkoutPlan, dayName: string, targetIndex: number) {
  const index = plan.days.findIndex((day) => normalize(day.name) === normalize(dayName) || normalize(day.name).includes(normalize(dayName)));
  if (index < 0) return false;
  const [day] = plan.days.splice(index, 1);
  plan.days.splice(Math.max(0, Math.min(plan.days.length, targetIndex)), 0, day);
  plan.days = plan.days.map((item, itemIndex) => ({ ...item, dayIndex: itemIndex + 1 }));
  return true;
}

function swapDays(plan: GeneratedWorkoutPlan, firstName: string, secondName: string) {
  const firstIndex = plan.days.findIndex((day) => normalize(day.name) === normalize(firstName) || normalize(day.name).includes(normalize(firstName)));
  const secondIndex = plan.days.findIndex((day) => normalize(day.name) === normalize(secondName) || normalize(day.name).includes(normalize(secondName)));
  if (firstIndex < 0 || secondIndex < 0) return false;
  const first = plan.days[firstIndex];
  plan.days[firstIndex] = plan.days[secondIndex];
  plan.days[secondIndex] = first;
  plan.days = plan.days.map((item, itemIndex) => ({ ...item, dayIndex: itemIndex + 1 }));
  return true;
}

function applyDayReorderRequests(text: string, plan: GeneratedWorkoutPlan, result: ProgramEditResult) {
  const normalized = normalize(text);
  let changed = false;
  let restIndex: number | undefined;

  const swapPattern = /swap\s+(.+?)\s+with\s+(.+?)(?=[.!?\n]|$)/gi;
  for (const match of text.matchAll(swapPattern)) {
    if (swapDays(plan, match[1].trim(), match[2].trim())) {
      changed = true;
      result.changed.push(`Swapped ${match[1].trim()} with ${match[2].trim()}.`);
    }
  }

  const beforePattern = /move\s+(.+?)\s+before\s+(.+?)(?=[.!?\n]|$)/gi;
  for (const match of text.matchAll(beforePattern)) {
    const target = findDay(plan, match[2].trim());
    if (target && moveDay(plan, match[1].trim(), Math.max(0, target.dayIndex - 1))) {
      changed = true;
      result.changed.push(`Moved ${match[1].trim()} before ${target.name}.`);
    }
  }

  const afterPattern = /(?:move|put)\s+(.+?)\s+after\s+(.+?)(?=[.!?\n]|$)/gi;
  for (const match of text.matchAll(afterPattern)) {
    const targetName = match[2].trim();
    if (/rest day|rest/.test(normalize(targetName))) {
      const moving = findDay(plan, match[1].trim());
      if (moving) {
        const targetIndex = Math.min(plan.days.length - 1, Math.max(0, Math.ceil(plan.days.length / 2)));
        moveDay(plan, moving.name, targetIndex);
        restIndex = targetIndex;
        changed = true;
        result.changed.push(`Placed a rest day before ${moving.name}.`);
      }
      continue;
    }
    const target = findDay(plan, targetName);
    if (target && moveDay(plan, match[1].trim(), target.dayIndex)) {
      changed = true;
      result.changed.push(`Moved ${match[1].trim()} after ${target.name}.`);
    }
  }

  const orderMatch = text.match(/(?:change the order to|reorder to|order to)\s+(.+?)(?=[.!?\n]|$)/i);
  if (orderMatch) {
    const requested = orderMatch[1].split(/[,/>]+|\s+-\s+/).map((item) => normalize(item)).filter(Boolean);
    const available = [...plan.days];
    const ordered: PlanDay[] = [];
    for (const token of requested) {
      if (/rest/.test(token)) {
        restIndex = ordered.length;
        continue;
      }
      const index = available.findIndex((day) => {
        const type = dayType(day);
        return token.includes(type) || type.includes(token) || normalize(day.name).includes(token);
      });
      if (index >= 0) {
        ordered.push(available[index]);
        available.splice(index, 1);
      }
    }
    if (ordered.length) {
      plan.days = [...ordered, ...available].map((day, index) => ({ ...day, dayIndex: index + 1 }));
      changed = true;
      result.changed.push(`Changed training-day order to ${plan.days.map((day) => day.name).join(" > ")}.`);
    }
  }

  if (/harder leg day away from pull|legs b.*spine-sparing|spine sparing day.*later/.test(normalized)) {
    const legsB = findDay(plan, "Legs B") ?? findDay(plan, "Lower B");
    if (legsB) {
      legsB.recoveryRole = "Spine-sparing lower day placed later in the week to reduce pull-day overlap.";
      legsB.spinalLoading = "low";
      legsB.exercises = legsB.exercises.map((exercise) =>
        exercise.spinalLoading === "high"
          ? { ...exercise, spinalLoading: "moderate", targetRir: Math.min(4, exercise.targetRir + 1), substitutionNote: "Kept conservative for spine-sparing day." }
          : exercise
      );
      moveDay(plan, legsB.name, plan.days.length - 1);
      changed = true;
      result.changed.push(`${legsB.name} is now treated as the spine-sparing lower day and moved later in the week.`);
    }
  }

  if (changed) {
    rebuildWeeklyLayout(plan, restIndex);
    const warnings = analyzeRecoveryWarnings(plan);
    result.warnings.push(...warnings);
    result.summary.push("Preview the reordered week before applying. Exercises, sets, reps, RIR, rest, notes, and labels were preserved.");
  }
}

function applyPainRequests(
  text: string,
  plan: GeneratedWorkoutPlan,
  profile: FitnessProfileInput,
  settings: FitnessProgrammingSettings,
  result: ProgramEditResult
) {
  if (!/(hurt|bother|pain|elbow|knee|back|shoulder)/i.test(text)) return;
  const settingsPatch = result.settingsPatch ?? {};
  for (const exercise of findExercisesInText(text)) {
    markPainfulAndSubstitute(plan, exercise.name, profile, settings, settingsPatch, result);
  }
  result.settingsPatch = settingsPatch;
}

function addSummary(request: string, result: ProgramEditResult) {
  result.summary.push(`Interpreted request: ${request.trim().slice(0, 220)}${request.trim().length > 220 ? "..." : ""}`);
  result.summary.push("Used deterministic rule-based editing. No AI API call or prompt history storage was used.");
  if (!result.changed.length && !result.refused.length) {
    result.refused.push("No supported edit command was detected. Try replace, remove, add/reduce sets, change split, rest time, RIR, recovery, or junk-volume wording.");
  }
}

function mergeWarnings(plan: GeneratedWorkoutPlan, result: ProgramEditResult) {
  plan.warnings = uniqueList([...(plan.warnings ?? []), ...result.warnings]);
  result.warnings = plan.warnings;
}

export function editWorkoutPlanWithNaturalLanguage(input: ProgramEditInput): ProgramEditResult {
  const request = input.request.trim();
  const settings = withDefaultSettings(input.settings);
  let draftPlan = clonePlan(input.plan);
  const result: ProgramEditResult = {
    draftPlan,
    summary: [],
    changed: [],
    refused: [],
    warnings: [...(input.plan.warnings ?? [])]
  };

  if (!request) {
    result.refused.push("Describe the program change you want before previewing.");
    return result;
  }

  if (/restore the previous version|undo the last change|restore previous version/i.test(request)) {
    const previous = [...(input.plan.versionHistory ?? [])].sort((a, b) => b.versionNumber - a.versionNumber)[1] ?? input.plan.versionHistory?.at(-1);
    if (!previous) {
      result.refused.push("No previous version is available in this plan session.");
      addSummary(request, result);
      return result;
    }
    draftPlan = restorePlanVersion(input.plan, previous, input.profile, settings);
    result.draftPlan = draftPlan;
    result.changed.push(`Prepared restore preview for version ${previous.versionNumber}.`);
    result.warnings.push(...(draftPlan.warnings ?? []));
    addSummary(request, result);
    mergeWarnings(draftPlan, result);
    return result;
  }

  draftPlan = applySplitChange(request, draftPlan, input.profile, settings, result);
  result.draftPlan = draftPlan;

  applyAddExerciseRequests(request, draftPlan, input.profile, settings, result);
  applyReplacementRequests(request, draftPlan, input.profile, settings, result);
  applyDayReorderRequests(request, draftPlan, result);
  applyPainRequests(request, draftPlan, input.profile, settings, result);
  parseVolumeChanges(request, result, draftPlan);
  applyRestChanges(request, draftPlan, result);
  applyRirChanges(request, draftPlan, input.profile, result);
  applyRecoveryChanges(request, draftPlan, result);
  applyJunkVolumeRules(request, draftPlan, result);

  refreshPlanAfterEdit(draftPlan, result.changed);
  draftPlan.explanation = [
    ...(draftPlan.explanation ?? []),
    "Program Change Request applied as a deterministic draft. Review the preview before saving the plan."
  ];
  addSummary(request, result);
  mergeWarnings(draftPlan, result);

  result.draftPlan = draftPlan;
  return result;
}

export function volumeSummary(volume: MuscleVolume[]) {
  return muscles
    .map((muscle) => volume.find((item) => item.muscle === muscle))
    .filter((item): item is MuscleVolume => Boolean(item));
}
