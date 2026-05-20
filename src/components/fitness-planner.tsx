"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Play,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Timer,
  Trash2,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CollapsibleSection } from "@/components/collapsible-section";
import { ModuleAssistant } from "@/components/module-assistant";
import { Card, ProgressBar, SectionTitle } from "@/components/ui";
import { adaptiveRecommendations, generateWorkoutPlan } from "@/lib/fitness-programming";
import {
  analyzeRecoveryWarnings,
  applyWeeklyAdjustments,
  buildWeeklyAdjustmentRecommendations,
  clonePlan,
  createPlanExercise,
  createVersionSnapshot,
  ensureInitialVersion,
  muscleOptions,
  rebuildWeeklyLayout,
  refreshPlanAfterEdit,
  restorePlanVersion
} from "@/lib/fitness-plan-utils";
import { parseFitnessFeedbackAssistantRequest, type FitnessFeedbackAssistantPreview } from "@/lib/module-assistant-parsers";
import type {
  FitnessProgrammingSettings,
  FitnessProfileInput,
  GeneratedWorkoutPlan,
  PlanDay,
  PlanExercise,
  WorkoutLogView
} from "@/lib/types";
import type { ProgramEditResult as NaturalLanguageEditResult } from "@/lib/fitness-program-editor";

type Feedback = {
  pumpScore: number;
  targetLimited: boolean;
  jointPain: boolean;
  sessionDifficulty: number;
  soreness: number;
  performanceTrend: "improved" | "stable" | "dropped";
  recoveryQuality: number;
};

type WorkoutSetDraft = {
  id: string;
  exerciseName: string;
  isCustom?: boolean;
  setNumber: number;
  targetReps: string;
  targetRir: number;
  restSeconds: number;
  status: "pending" | "completed" | "skipped";
  weight: string;
  reps: string;
  rir: string;
  notes: string;
};

type WorkoutFeedback = {
  pumpQuality: number;
  targetMuscleFeel: number;
  jointPain: "none" | "mild" | "moderate" | "severe";
  sorenessExpected: "low" | "moderate" | "high";
  sessionDifficulty: number;
  performance: "better" | "same" | "worse";
  recovery: "good" | "okay" | "poor";
  notes: string;
};

type ReorderPreview = {
  plan: GeneratedWorkoutPlan;
  summary: string[];
  warnings: string[];
};

const defaultManualExercise = {
  dayIndex: 1,
  exerciseName: "",
  primaryMuscle: "Other",
  sets: 3,
  repRange: "8-15",
  targetRir: 3,
  restSeconds: 120,
  notes: ""
};

const fitnessFeedbackExamples = [
  "Felt great today, a bit sore in shoulders, pump was nice.",
  "Workout was hard, chest pump was good, elbows felt a little weird.",
  "Performance was better today, recovery felt good.",
  "Legs felt sore and lower back was tired.",
  "Shoulder pump was great but joints felt fine."
];

function compactPlanKey(plan: GeneratedWorkoutPlan) {
  return `${plan.name}-${plan.days.length}-${plan.days.map((day) => `${day.name}:${day.exercises.length}`).join("|")}`;
}

function buttonClass(tone: "primary" | "blue" | "ghost" | "danger" = "ghost") {
  const tones = {
    primary: "bg-mineral text-[#041018] hover:bg-mineral/90",
    blue: "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40 hover:bg-blue-500",
    ghost: "border border-line bg-surface text-ink hover:bg-mineral/10",
    danger: "border border-ember/40 bg-ember/10 text-ink hover:bg-ember/20"
  };
  return `focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`;
}

function fieldClass() {
  return "focus-ring h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink";
}

function areaClass() {
  return "focus-ring min-h-20 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6 text-ink";
}

function exerciseKey(day: PlanDay, exercise: PlanExercise, index: number) {
  return `${day.dayIndex}-${exercise.exerciseName}-${index}`;
}

function summarizeWorkoutSets(sets: WorkoutSetDraft[], day: PlanDay) {
  const completed = sets.filter((set) => set.status === "completed");
  const skipped = sets.filter((set) => set.status === "skipped");
  const totalVolumeLoad = completed.reduce((total, set) => total + Number(set.weight || 0) * Number(set.reps || 0), 0);
  return {
    dayName: day.name,
    completedSets: completed.length,
    skippedSets: skipped.length,
    totalVolumeLoad,
    musclesTrained: day.focusMuscles,
    exerciseSummaries: day.exercises.map((exercise) => {
      const exerciseSets = sets.filter((set) => set.exerciseName === exercise.exerciseName);
      return {
        exerciseName: exercise.exerciseName,
        completedSets: exerciseSets.filter((set) => set.status === "completed").length,
        skippedSets: exerciseSets.filter((set) => set.status === "skipped").length,
        volumeLoad: exerciseSets.reduce((total, set) => total + Number(set.weight || 0) * Number(set.reps || 0), 0),
        notes: exerciseSets.map((set) => set.notes).filter(Boolean).join(" | ") || undefined
      };
    })
  };
}

function mapWorkoutTrend(value: WorkoutFeedback["performance"]): WorkoutLogView["performanceTrend"] {
  if (value === "better") return "improved";
  if (value === "worse") return "dropped";
  return "stable";
}

export function FitnessPlanner({
  plan,
  profile,
  settings,
  onSettingsChange,
  onProfileChange,
  workoutLogs = []
}: {
  plan: GeneratedWorkoutPlan;
  profile: FitnessProfileInput;
  settings?: FitnessProgrammingSettings | null;
  onSettingsChange?: (settings: FitnessProgrammingSettings) => void;
  onProfileChange?: (profile: FitnessProfileInput) => void;
  workoutLogs?: WorkoutLogView[];
}) {
  const [currentPlan, setCurrentPlan] = useState(() => ensureInitialVersion(plan));
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [changeRequest, setChangeRequest] = useState("");
  const [editResult, setEditResult] = useState<NaturalLanguageEditResult | null>(null);
  const [editorStatus, setEditorStatus] = useState<string | null>(null);
  const [feedbackRequest, setFeedbackRequest] = useState("");
  const [feedbackPreview, setFeedbackPreview] = useState<FitnessFeedbackAssistantPreview | null>(null);
  const [feedbackAssistantStatus, setFeedbackAssistantStatus] = useState<string | null>(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [appliedFeedbackPreviewId, setAppliedFeedbackPreviewId] = useState<string | null>(null);
  const [manualExercise, setManualExercise] = useState(defaultManualExercise);
  const [reorderPreview, setReorderPreview] = useState<ReorderPreview | null>(null);
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [logs, setLogs] = useState(workoutLogs);
  const [selectedAdjustmentIds, setSelectedAdjustmentIds] = useState<Set<string> | null>(null);
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<PlanDay | null>(null);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSetDraft[]>([]);
  const [restRemaining, setRestRemaining] = useState(0);
  const [workoutStatus, setWorkoutStatus] = useState<string | null>(null);
  const [workoutSummary, setWorkoutSummary] = useState<ReturnType<typeof summarizeWorkoutSets> | null>(null);
  const [workoutFeedback, setWorkoutFeedback] = useState<WorkoutFeedback>({
    pumpQuality: 3,
    targetMuscleFeel: 3,
    jointPain: "none",
    sorenessExpected: "moderate",
    sessionDifficulty: 6,
    performance: "same",
    recovery: "okay",
    notes: ""
  });
  const [feedback, setFeedback] = useState<Feedback>({
    pumpScore: 7,
    targetLimited: true,
    jointPain: false,
    sessionDifficulty: 7,
    soreness: 4,
    performanceTrend: "stable",
    recoveryQuality: 7
  });

  const weeklyRecommendations = useMemo(() => buildWeeklyAdjustmentRecommendations(currentPlan, logs), [currentPlan, logs]);
  const sortedVersions = [...(currentPlan.versionHistory ?? [])].sort((a, b) => b.versionNumber - a.versionNumber);
  const effectiveSelectedAdjustmentIds = selectedAdjustmentIds ?? new Set(weeklyRecommendations.filter((item) => item.selected).map((item) => item.id));

  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = window.setInterval(() => setRestRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  function commitPlan(next: GeneratedWorkoutPlan, label: string, summary: string[]) {
    refreshPlanAfterEdit(next, summary);
    setCurrentPlan(createVersionSnapshot(next, label, summary));
  }

  function snapshotCurrent(label: string, summary: string[]) {
    const next = clonePlan(currentPlan);
    commitPlan(next, label, summary);
  }

  function updatePlanFromFeedback() {
    const next = generateWorkoutPlan(profile, {
      jointPain: feedback.jointPain,
      performanceTrend: feedback.performanceTrend,
      soreness: feedback.soreness,
      recoveryQuality: feedback.recoveryQuality
    }, settings ?? undefined);
    commitPlan(next, "Feedback-adjusted regeneration", ["Regenerated program from post-workout feedback inputs."]);
  }

  async function savePlan() {
    setSaveStatus("Saving...");
    const response = await fetch("/api/fitness/program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentPlan)
    });
    setSaveStatus(response.ok ? "Program saved to your account with JSON metadata for custom exercises and versions." : "Could not save the program.");
  }

  function updateFeedbackPreview(patch: Partial<FitnessFeedbackAssistantPreview>) {
    setFeedbackPreview((current) => (current ? { ...current, ...patch } : current));
    setAppliedFeedbackPreviewId(null);
  }

  function parseFeedbackRequest() {
    setFeedbackPreview(parseFitnessFeedbackAssistantRequest(feedbackRequest));
    setFeedbackAssistantStatus(null);
    setAppliedFeedbackPreviewId(null);
  }

  async function applyFeedbackPreview() {
    if (!feedbackPreview || feedbackSaving || appliedFeedbackPreviewId === feedbackPreview.id) return;
    setFeedbackSaving(true);
    setFeedbackAssistantStatus("Saving structured workout feedback...");
    try {
      const response = await fetch("/api/assistants/fitness-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPreview)
      });
      const json = (await response.json().catch(() => null)) as { data?: { id?: string }; error?: string } | null;
      if (!response.ok) throw new Error(json?.error ?? "Could not save workout feedback.");
      const localLog: WorkoutLogView = {
        id: json?.data?.id ?? `assistant-${Date.now()}`,
        date: feedbackPreview.date,
        title: feedbackPreview.titleText,
        durationMinutes: 0,
        sessionDifficulty: feedbackPreview.sessionDifficulty,
        performanceTrend: mapWorkoutTrend(feedbackPreview.performance),
        notes: feedbackPreview.notes,
        feedback: {
          pumpScore: feedbackPreview.pumpQuality,
          targetMuscleFeel: feedbackPreview.targetMuscleFeel,
          jointPain: feedbackPreview.jointPain,
          sorenessExpected: feedbackPreview.sorenessLevel,
          sessionDifficulty: feedbackPreview.sessionDifficulty,
          performance: feedbackPreview.performance,
          recovery: feedbackPreview.recovery,
          notes: feedbackPreview.notes
        }
      };
      setLogs((current) => [localLog, ...current]);
      setAppliedFeedbackPreviewId(feedbackPreview.id);
      setFeedbackAssistantStatus(
        feedbackPreview.jointPain === "none"
          ? "Saved workout feedback."
          : "Saved workout feedback. Joint pain was flagged; review substitutions and do not push through pain."
      );
    } catch (error) {
      setFeedbackAssistantStatus(error instanceof Error ? error.message : "Could not save workout feedback.");
    } finally {
      setFeedbackSaving(false);
    }
  }

  function openWorkout(day: PlanDay) {
    const sets = day.exercises.flatMap((exercise) =>
      Array.from({ length: exercise.sets }, (_, index) => ({
        id: `${exercise.exerciseName}-${index + 1}-${Date.now()}`,
        exerciseName: exercise.exerciseName,
        isCustom: exercise.isCustom,
        setNumber: index + 1,
        targetReps: exercise.repRange,
        targetRir: exercise.targetRir,
        restSeconds: exercise.restSeconds,
        status: "pending" as const,
        weight: "",
        reps: "",
        rir: String(exercise.targetRir),
        notes: ""
      }))
    );
    setActiveWorkoutDay(day);
    setWorkoutSets(sets);
    setWorkoutSummary(null);
    setWorkoutStatus(null);
    setRestRemaining(0);
  }

  async function previewProgramChanges() {
    const request = changeRequest.trim();
    if (!request) {
      setEditorStatus("Describe the program change you want before previewing.");
      return;
    }

    const startMatch = request.match(/start(?: today'?s)?\s+(.+?)\s+workout/i);
    if (startMatch) {
      const requested = startMatch[1].trim();
      const day = currentPlan.days.find((item) => item.name.toLowerCase().includes(requested.toLowerCase())) ?? currentPlan.days[0];
      if (day) openWorkout(day);
      setEditorStatus(day ? `Opened ${day.name} workout mode.` : "No workout day is available to start.");
      return;
    }

    if (/weekly adjustment|use the weekly|apply only|next week lower volume|lower volume because recovery was bad/i.test(request)) {
      const selectedMuscles = muscleOptions.filter((muscle) => new RegExp(muscle, "i").test(request));
      const selected = weeklyRecommendations.map((item) => ({
        ...item,
        selected: /lower volume because recovery was bad/i.test(request)
          ? item.action === "remove_set" || item.action === "deload"
          : selectedMuscles.length
            ? selectedMuscles.includes(item.muscle)
            : item.selected
      }));
      const draftPlan = applyWeeklyAdjustments(currentPlan, selected);
      setEditResult({
        draftPlan,
        summary: [`Interpreted request: ${request}`],
        changed: draftPlan.lastChangeSummary ?? selected.filter((item) => item.selected).map((item) => item.recommendation),
        refused: [],
        warnings: draftPlan.warnings ?? []
      });
      setEditorStatus("Weekly adjustment preview ready.");
      return;
    }

    setEditorStatus("Interpreting request...");
    setEditResult(null);
    const response = await fetch("/api/fitness/program-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request,
        plan: currentPlan,
        profile,
        settings
      })
    });

    const payload = (await response.json().catch(() => null)) as { data?: NaturalLanguageEditResult; error?: string } | null;
    if (!response.ok || !payload?.data) {
      setEditorStatus(payload?.error ?? "Could not preview changes. If the request is very long, split it into smaller edits.");
      return;
    }

    setEditResult(payload.data);
    setEditorStatus("Draft preview ready. Review it before applying.");
  }

  function applyProgramChanges() {
    if (!editResult) {
      setEditorStatus("Preview changes before applying them.");
      return;
    }

    const draft = clonePlan(editResult.draftPlan);
    refreshPlanAfterEdit(draft, editResult.changed);
    const next =
      draft.currentVersion && draft.currentVersion !== currentPlan.currentVersion
        ? draft
        : createVersionSnapshot(draft, "AI Program Editor", editResult.changed.length ? editResult.changed : ["Applied AI Program Editor draft."]);
    setCurrentPlan(next);
    if (settings && onSettingsChange && editResult.settingsPatch) {
      onSettingsChange({
        ...settings,
        ...editResult.settingsPatch,
        preferredExercises: editResult.settingsPatch.preferredExercises ?? settings.preferredExercises,
        favoriteExercises: editResult.settingsPatch.favoriteExercises ?? settings.favoriteExercises,
        blockedExercises: editResult.settingsPatch.blockedExercises ?? settings.blockedExercises,
        painfulExercises: editResult.settingsPatch.painfulExercises ?? settings.painfulExercises,
        weakMusclePriorities: editResult.settingsPatch.weakMusclePriorities ?? settings.weakMusclePriorities
      });
    }
    if (onProfileChange && editResult.profilePatch) {
      onProfileChange({
        ...profile,
        ...editResult.profilePatch,
        availableEquipment: editResult.profilePatch.availableEquipment ?? profile.availableEquipment,
        weakMuscleGroups: editResult.profilePatch.weakMuscleGroups ?? profile.weakMuscleGroups,
        strengthNumbers: editResult.profilePatch.strengthNumbers ?? profile.strengthNumbers,
        preferredExercises: editResult.profilePatch.preferredExercises ?? profile.preferredExercises,
        favoriteExercises: editResult.profilePatch.favoriteExercises ?? profile.favoriteExercises,
        blockedExercises: editResult.profilePatch.blockedExercises ?? profile.blockedExercises,
        painfulExercises: editResult.profilePatch.painfulExercises ?? profile.painfulExercises
      });
    }
    setEditorStatus("Draft applied to the current program. Save the plan if you want to keep it.");
  }

  function resetDraft() {
    setEditResult(null);
    setEditorStatus(null);
    setChangeRequest("");
  }

  function updateExercise(dayIndex: number, exerciseIndex: number, patch: Partial<PlanExercise>) {
    setCurrentPlan((current) => {
      const next = clonePlan(current);
      const day = next.days.find((item) => item.dayIndex === dayIndex);
      if (!day) return current;
      day.exercises[exerciseIndex] = { ...day.exercises[exerciseIndex], ...patch };
      if (patch.primaryMuscle && !day.focusMuscles.includes(patch.primaryMuscle)) day.focusMuscles = [...day.focusMuscles, patch.primaryMuscle];
      refreshPlanAfterEdit(next, ["Manual exercise edit."]);
      return next;
    });
  }

  function addManualExercise() {
    const day = currentPlan.days.find((item) => item.dayIndex === manualExercise.dayIndex) ?? currentPlan.days[0];
    if (!day || !manualExercise.exerciseName.trim()) return;
    const next = clonePlan(currentPlan);
    const targetDay = next.days.find((item) => item.dayIndex === day.dayIndex);
    if (!targetDay) return;
    const exercise = createPlanExercise(manualExercise.exerciseName, targetDay, profile, settings, {
      primaryMuscle: manualExercise.primaryMuscle,
      sets: manualExercise.sets,
      repRange: manualExercise.repRange,
      targetRir: manualExercise.targetRir,
      restSeconds: manualExercise.restSeconds,
      notes: manualExercise.notes
    });
    if ([...(profile.blockedExercises ?? []), ...(profile.painfulExercises ?? []), ...(settings?.blockedExercises ?? []), ...(settings?.painfulExercises ?? [])]
      .some((name) => name.toLowerCase() === exercise.exerciseName.toLowerCase())) {
      setEditorStatus(`Did not add ${exercise.exerciseName}; it is blocked or marked painful.`);
      return;
    }
    targetDay.exercises.push(exercise);
    targetDay.focusMuscles = Array.from(new Set([...targetDay.focusMuscles, exercise.primaryMuscle]));
    commitPlan(next, "Added custom exercise", [`Added ${exercise.exerciseName} to ${targetDay.name}.`]);
    setManualExercise({ ...defaultManualExercise, dayIndex: day.dayIndex });
  }

  function mutateExercise(dayIndex: number, exerciseIndex: number, action: "remove" | "duplicate" | "up" | "down" | "move", targetDayIndex?: number) {
    const next = clonePlan(currentPlan);
    const day = next.days.find((item) => item.dayIndex === dayIndex);
    if (!day) return;
    const exercise = day.exercises[exerciseIndex];
    if (!exercise) return;
    const summary: string[] = [];

    if (action === "move" && typeof targetDayIndex === "number" && targetDayIndex !== dayIndex) {
      const targetDay = next.days.find((item) => item.dayIndex === targetDayIndex);
      if (targetDay) {
        day.exercises.splice(exerciseIndex, 1);
        targetDay.exercises.push(exercise);
        targetDay.focusMuscles = Array.from(new Set([...targetDay.focusMuscles, exercise.primaryMuscle]));
        summary.push(`Moved ${exercise.exerciseName} from ${day.name} to ${targetDay.name}.`);
      }
    }
    if (action === "remove") {
      day.exercises.splice(exerciseIndex, 1);
      summary.push(`Removed ${exercise.exerciseName} from ${day.name}.`);
    }
    if (action === "duplicate") {
      day.exercises.splice(exerciseIndex + 1, 0, { ...exercise, exerciseName: `${exercise.exerciseName} Copy` });
      summary.push(`Duplicated ${exercise.exerciseName} in ${day.name}.`);
    }
    if (action === "up" && exerciseIndex > 0) {
      [day.exercises[exerciseIndex - 1], day.exercises[exerciseIndex]] = [day.exercises[exerciseIndex], day.exercises[exerciseIndex - 1]];
      summary.push(`Moved ${exercise.exerciseName} up in ${day.name}.`);
    }
    if (action === "down" && exerciseIndex < day.exercises.length - 1) {
      [day.exercises[exerciseIndex + 1], day.exercises[exerciseIndex]] = [day.exercises[exerciseIndex], day.exercises[exerciseIndex + 1]];
      summary.push(`Moved ${exercise.exerciseName} down in ${day.name}.`);
    }
    if (summary.length) commitPlan(next, "Manual exercise edit", summary);
  }

  function previewDayMove(dayIndex: number, direction: "up" | "down" | "swap-next" | "position", position?: number) {
    const next = clonePlan(currentPlan);
    const index = next.days.findIndex((day) => day.dayIndex === dayIndex);
    if (index < 0) return;
    const summary: string[] = [];
    if (direction === "up" && index > 0) {
      [next.days[index - 1], next.days[index]] = [next.days[index], next.days[index - 1]];
      summary.push(`Moved ${next.days[index - 1].name} up.`);
    }
    if (direction === "down" && index < next.days.length - 1) {
      [next.days[index + 1], next.days[index]] = [next.days[index], next.days[index + 1]];
      summary.push(`Moved ${next.days[index + 1].name} down.`);
    }
    if (direction === "swap-next" && index < next.days.length - 1) {
      const first = next.days[index].name;
      const second = next.days[index + 1].name;
      [next.days[index + 1], next.days[index]] = [next.days[index], next.days[index + 1]];
      summary.push(`Swapped ${first} with ${second}.`);
    }
    if (direction === "position" && typeof position === "number") {
      const [day] = next.days.splice(index, 1);
      next.days.splice(Math.max(0, Math.min(next.days.length, position - 1)), 0, day);
      summary.push(`Moved ${day.name} to position ${position}.`);
    }
    next.days = next.days.map((day, itemIndex) => ({ ...day, dayIndex: itemIndex + 1 }));
    rebuildWeeklyLayout(next);
    const warnings = analyzeRecoveryWarnings(next);
    refreshPlanAfterEdit(next, summary);
    setReorderPreview({ plan: next, summary, warnings });
  }

  function applyReorderPreview() {
    if (!reorderPreview) return;
    commitPlan(reorderPreview.plan, "Reordered training days", reorderPreview.summary);
    setReorderPreview(null);
  }

  function restoreVersion(versionNumber: number) {
    const version = currentPlan.versionHistory?.find((item) => item.versionNumber === versionNumber);
    if (!version) return;
    const confirmed = window.confirm(`Restore version ${version.versionNumber}? This replaces the current plan preview and skips blocked or painful exercises.`);
    if (!confirmed) return;
    setCurrentPlan(restorePlanVersion(currentPlan, version, profile, settings));
  }

  function applySelectedWeeklyAdjustments() {
    const selected = weeklyRecommendations.map((item) => ({ ...item, selected: effectiveSelectedAdjustmentIds.has(item.id) }));
    setCurrentPlan(applyWeeklyAdjustments(currentPlan, selected));
  }

  function completeSet(id: string) {
    setWorkoutSets((current) => current.map((set) => set.id === id ? { ...set, status: "completed" } : set));
    const completed = workoutSets.find((set) => set.id === id);
    if (completed) setRestRemaining(completed.restSeconds);
  }

  function skipSet(id: string) {
    setWorkoutSets((current) => current.map((set) => set.id === id ? { ...set, status: "skipped" } : set));
  }

  function addSet(exerciseName: string) {
    const exerciseSets = workoutSets.filter((set) => set.exerciseName === exerciseName);
    const template = exerciseSets[exerciseSets.length - 1];
    if (!template) return;
    setWorkoutSets((current) => [
      ...current,
      {
        ...template,
        id: `${exerciseName}-${Date.now()}`,
        setNumber: exerciseSets.length + 1,
        status: "pending",
        weight: "",
        reps: "",
        notes: ""
      }
    ]);
  }

  function removeSet(id: string) {
    setWorkoutSets((current) => current.filter((set) => set.id !== id));
  }

  async function finishWorkout() {
    if (!activeWorkoutDay) return;
    setWorkoutStatus("Saving workout...");
    const summary = summarizeWorkoutSets(workoutSets, activeWorkoutDay);
    const response = await fetch("/api/fitness/workout-execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day: activeWorkoutDay,
        sets: workoutSets
          .filter((set) => set.status !== "pending")
          .map((set) => ({
            exerciseName: set.exerciseName,
            isCustom: set.isCustom,
            setNumber: set.setNumber,
            status: set.status,
            reps: Number(set.reps || 0),
            weight: Number(set.weight || 0),
            rir: Number(set.rir || 0),
            restSeconds: set.restSeconds,
            notes: set.notes
          })),
        feedback: workoutFeedback
      })
    });
    if (!response.ok) {
      setWorkoutStatus("Could not save workout. Check your session and database.");
      return;
    }
    const localLog: WorkoutLogView = {
      id: `local-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      title: activeWorkoutDay.name,
      durationMinutes: 0,
      sessionDifficulty: workoutFeedback.sessionDifficulty,
      performanceTrend: mapWorkoutTrend(workoutFeedback.performance),
      execution: summary,
      feedback: {
        pumpScore: workoutFeedback.pumpQuality,
        targetMuscleFeel: workoutFeedback.targetMuscleFeel,
        jointPain: workoutFeedback.jointPain,
        sorenessExpected: workoutFeedback.sorenessExpected,
        sessionDifficulty: workoutFeedback.sessionDifficulty,
        performance: workoutFeedback.performance,
        recovery: workoutFeedback.recovery,
        notes: workoutFeedback.notes
      }
    };
    setLogs((current) => [localLog, ...current]);
    setWorkoutSummary(summary);
    setWorkoutStatus(
      workoutFeedback.jointPain === "none"
        ? "Workout saved."
        : "Workout saved. Joint pain was flagged; do not push through pain and review substitutions."
    );
  }

  return (
    <div className="space-y-5" key={compactPlanKey(currentPlan)}>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle title="Current Program" subtitle={`${currentPlan.name}. Split: ${currentPlan.split}. Mesocycle week ${currentPlan.mesocycleWeek}. Version ${currentPlan.currentVersion ?? 1}.`} />
            <button className={`${buttonClass("primary")} w-full sm:w-auto`} onClick={savePlan} type="button">
              <Save size={17} />
              Save Plan
            </button>
          </div>
          {saveStatus ? <p className="mb-4 rounded-lg border border-line bg-surface p-3 text-sm text-muted">{saveStatus}</p> : null}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(currentPlan.weeklyLayout ?? []).map((day) => (
              <div key={day.day} className="rounded-lg border border-line bg-surface p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">{day.day}</p>
                <p className="mt-1 font-semibold text-ink">{day.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{day.training ? day.focusMuscles.slice(0, 3).join(", ") : day.note}</p>
              </div>
            ))}
          </div>
          {currentPlan.warnings?.length ? (
            <div className="mb-4 space-y-2">
              {currentPlan.warnings.map((warning) => (
                <div key={warning} className="flex gap-2 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm leading-6 text-ink">
                  <AlertTriangle className="mt-0.5 shrink-0 text-gold" size={16} />
                  <p>{warning}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {currentPlan.days.map((day) => (
              <div key={day.dayIndex} className="rounded-lg border border-line p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{day.name}</h3>
                    <p className="mt-1 text-sm text-muted">{day.focusMuscles.join(", ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className={buttonClass("blue")} type="button" onClick={() => openWorkout(day)}>
                      <Play size={16} />
                      Start Workout
                    </button>
                    <button className={buttonClass("ghost")} type="button" onClick={() => previewDayMove(day.dayIndex, "up")} title="Move day up"><ArrowUp size={15} /></button>
                    <button className={buttonClass("ghost")} type="button" onClick={() => previewDayMove(day.dayIndex, "down")} title="Move day down"><ArrowDown size={15} /></button>
                    <button className={buttonClass("ghost")} type="button" onClick={() => previewDayMove(day.dayIndex, "swap-next")}>Swap</button>
                    <select className="focus-ring h-10 rounded-md border border-line bg-surface px-2 text-sm text-ink" value={day.dayIndex} onChange={(event) => previewDayMove(day.dayIndex, "position", Number(event.target.value))}>
                      {currentPlan.days.map((item) => <option key={item.dayIndex} value={item.dayIndex}>Pos {item.dayIndex}</option>)}
                    </select>
                  </div>
                </div>
                {day.recoveryRole ? <p className="mt-2 text-xs leading-5 text-muted">{day.recoveryRole}</p> : null}
                <div className="mt-3 space-y-3">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseKey(day, exercise, exerciseIndex)} className="rounded-lg border border-line bg-surface p-3">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className={`${fieldClass()} max-w-[260px] font-semibold`}
                              value={exercise.exerciseName}
                              onChange={(event) => updateExercise(day.dayIndex, exerciseIndex, { exerciseName: event.target.value })}
                              onBlur={() => snapshotCurrent("Manual exercise edit", [`Edited ${exercise.exerciseName} in ${day.name}.`])}
                            />
                            {exercise.isCustom ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">Custom</span> : null}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted">{exercise.customWarning ?? exercise.substitutionNote ?? exercise.rationale}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className={buttonClass("ghost")} type="button" onClick={() => mutateExercise(day.dayIndex, exerciseIndex, "up")} title="Move exercise up"><ArrowUp size={15} /></button>
                          <button className={buttonClass("ghost")} type="button" onClick={() => mutateExercise(day.dayIndex, exerciseIndex, "down")} title="Move exercise down"><ArrowDown size={15} /></button>
                          <button className={buttonClass("ghost")} type="button" onClick={() => mutateExercise(day.dayIndex, exerciseIndex, "duplicate")} title="Duplicate exercise"><Copy size={15} /></button>
                          <button className={buttonClass("danger")} type="button" onClick={() => mutateExercise(day.dayIndex, exerciseIndex, "remove")} title="Remove exercise"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Muscle</span>
                          <select
                            className={fieldClass()}
                            value={exercise.primaryMuscle}
                            disabled={!exercise.isCustom}
                            onChange={(event) => updateExercise(day.dayIndex, exerciseIndex, { primaryMuscle: event.target.value })}
                            onBlur={() => snapshotCurrent("Manual target muscle edit", [`Set ${exercise.exerciseName} target muscle to ${exercise.primaryMuscle}.`])}
                          >
                            {muscleOptions.map((muscle) => <option key={muscle} value={muscle}>{muscle}</option>)}
                          </select>
                        </label>
                        <NumberEdit label="Sets" value={exercise.sets} onChange={(value) => updateExercise(day.dayIndex, exerciseIndex, { sets: value })} onBlur={() => snapshotCurrent("Manual sets edit", [`Edited sets for ${exercise.exerciseName}.`])} />
                        <TextEdit label="Reps" value={exercise.repRange} onChange={(value) => updateExercise(day.dayIndex, exerciseIndex, { repRange: value })} onBlur={() => snapshotCurrent("Manual reps edit", [`Edited reps for ${exercise.exerciseName}.`])} />
                        <NumberEdit label="RIR" value={exercise.targetRir} onChange={(value) => updateExercise(day.dayIndex, exerciseIndex, { targetRir: value })} onBlur={() => snapshotCurrent("Manual RIR edit", [`Edited RIR for ${exercise.exerciseName}.`])} />
                        <NumberEdit label="Rest" value={exercise.restSeconds} onChange={(value) => updateExercise(day.dayIndex, exerciseIndex, { restSeconds: value })} onBlur={() => snapshotCurrent("Manual rest edit", [`Edited rest time for ${exercise.exerciseName}.`])} />
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Move To</span>
                          <select className={fieldClass()} value={day.dayIndex} onChange={(event) => mutateExercise(day.dayIndex, exerciseIndex, "move", Number(event.target.value))}>
                            {currentPlan.days.map((item) => <option key={item.dayIndex} value={item.dayIndex}>{item.name}</option>)}
                          </select>
                        </label>
                      </div>
                      <label className="mt-2 block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
                        <textarea className={areaClass()} value={exercise.notes ?? ""} onChange={(event) => updateExercise(day.dayIndex, exerciseIndex, { notes: event.target.value })} onBlur={() => snapshotCurrent("Manual notes edit", [`Edited notes for ${exercise.exerciseName}.`])} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <CollapsibleSection title="Add Custom Exercise" subtitle="Stored inside this program; no exercise table or migration is used." defaultOpen={false}>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Workout Day</span>
              <select className={fieldClass()} value={manualExercise.dayIndex} onChange={(event) => setManualExercise((current) => ({ ...current, dayIndex: Number(event.target.value) }))}>
                {currentPlan.days.map((day) => <option key={day.dayIndex} value={day.dayIndex}>{day.name}</option>)}
              </select>
            </label>
            <TextEdit label="Exercise Name" value={manualExercise.exerciseName} onChange={(value) => setManualExercise((current) => ({ ...current, exerciseName: value }))} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Target Muscle</span>
              <select className={fieldClass()} value={manualExercise.primaryMuscle} onChange={(event) => setManualExercise((current) => ({ ...current, primaryMuscle: event.target.value }))}>
                {muscleOptions.map((muscle) => <option key={muscle} value={muscle}>{muscle}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <NumberEdit label="Sets" value={manualExercise.sets} onChange={(value) => setManualExercise((current) => ({ ...current, sets: value }))} />
              <TextEdit label="Reps" value={manualExercise.repRange} onChange={(value) => setManualExercise((current) => ({ ...current, repRange: value }))} />
              <NumberEdit label="RIR" value={manualExercise.targetRir} onChange={(value) => setManualExercise((current) => ({ ...current, targetRir: value }))} />
              <NumberEdit label="Rest" value={manualExercise.restSeconds} onChange={(value) => setManualExercise((current) => ({ ...current, restSeconds: value }))} />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
              <textarea className={areaClass()} value={manualExercise.notes} onChange={(event) => setManualExercise((current) => ({ ...current, notes: event.target.value }))} />
            </label>
            <button className={`${buttonClass("primary")} w-full`} type="button" onClick={addManualExercise}>
              <Plus size={17} />
              Add Custom Exercise
            </button>
            <p className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs leading-5 text-muted">
              Custom exercises use unknown hypertrophy and stability ratings, moderate fatigue defaults, and should be edited before you rely on volume totals.
            </p>
          </div>
        </CollapsibleSection>
      </div>

      {reorderPreview ? (
        <Card>
          <SectionTitle title="Reordered Week Preview" subtitle="Review the new order before applying. Reordering is not hard-blocked." />
          <div className="grid gap-3 md:grid-cols-2">
            <PreviewList title="Summary" items={reorderPreview.summary} tone="green" />
            <PreviewList title="Recovery Warnings" items={reorderPreview.warnings} tone="amber" empty="No recovery warnings for this order." />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(reorderPreview.plan.weeklyLayout ?? []).map((day) => (
              <div key={day.day} className="rounded-md border border-line bg-surface p-3 text-sm">
                <p className="font-semibold text-ink">{day.day}: {day.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{day.training ? day.focusMuscles.join(", ") : day.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={buttonClass("primary")} type="button" onClick={applyReorderPreview}>Apply Reorder</button>
            <button className={buttonClass("ghost")} type="button" onClick={() => setReorderPreview(null)}>Cancel</button>
          </div>
        </Card>
      ) : null}

      <CollapsibleSection title="Fitness Feedback Assistant" subtitle="Turn workout notes into structured recovery, soreness, pain, pump, and performance feedback." defaultOpen={false} contentMode="outside">
        <ModuleAssistant
          moduleName="Fitness Feedback"
          placeholder="Example: Felt great today, a bit sore in shoulders, pump was nice."
          examplePrompts={fitnessFeedbackExamples}
          request={feedbackRequest}
          onRequestChange={setFeedbackRequest}
          onSubmit={parseFeedbackRequest}
          loading={feedbackSaving}
          preview={feedbackPreview}
          status={feedbackAssistantStatus}
          applyLabel={feedbackSaving ? "Saving..." : "Save Feedback"}
          onApply={applyFeedbackPreview}
          onCancel={() => {
            setFeedbackPreview(null);
            setFeedbackAssistantStatus("Preview cancelled. No workout feedback was saved.");
          }}
          onClear={() => {
            setFeedbackRequest("");
            setFeedbackPreview(null);
            setFeedbackAssistantStatus(null);
            setAppliedFeedbackPreviewId(null);
          }}
          applyDisabled={feedbackSaving || !feedbackPreview || appliedFeedbackPreviewId === feedbackPreview.id}
          renderPreview={(item) => (
            <FitnessFeedbackPreview
              preview={item}
              onChange={updateFeedbackPreview}
            />
          )}
        />
      </CollapsibleSection>

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white ring-1 ring-blue-400/40">
              <Wand2 size={18} />
            </span>
            <SectionTitle title="AI Program Editor" subtitle="Natural-language edits create a preview and then a version snapshot when applied." />
          </div>
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">Preview required</span>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Describe changes you want</span>
          <textarea
            className="focus-ring min-h-44 w-full resize-y rounded-md border border-line bg-surface px-3 py-3 text-sm leading-6 text-ink placeholder:text-muted"
            placeholder={"Examples:\nAdd cable pullover to Pull A.\nReplace leg press with pendulum squat as a custom exercise.\nSwap Lower A with Lower B.\nUse the weekly adjustment recommendations.\nStart today's Pull A workout."}
            value={changeRequest}
            onChange={(event) => setChangeRequest(event.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button className={`${buttonClass("blue")} w-full sm:w-auto`} type="button" onClick={previewProgramChanges}>
            <Wand2 size={17} />
            Preview Changes
          </button>
          <button className={`${buttonClass("primary")} w-full sm:w-auto`} type="button" onClick={applyProgramChanges} disabled={!editResult}>
            <CheckCircle2 size={17} />
            Apply Changes
          </button>
          <button className={`${buttonClass("ghost")} w-full sm:w-auto`} type="button" onClick={resetDraft}>
            <RotateCcw size={17} />
            Reset Draft
          </button>
          {editorStatus ? <p className="self-center text-sm text-muted">{editorStatus}</p> : null}
        </div>

        {editResult ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <PreviewList title="Summary of Requested Changes" items={editResult.summary} tone="default" />
              <PreviewList title="What SelfOS Changed" items={editResult.changed} tone="green" empty="No supported edits were applied yet." />
              <PreviewList title="Refused or Modified for Safety" items={editResult.refused} tone="amber" empty="No refusals for this draft." />
              <PreviewList title="Warnings" items={editResult.warnings} tone="amber" empty="No additional warnings." />
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-line bg-surface p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">Updated Weekly Split</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(editResult.draftPlan.weeklyLayout ?? []).map((day) => (
                    <div key={day.day} className="rounded-md border border-line bg-panel p-3 text-sm">
                      <p className="font-semibold text-ink">{day.day}: {day.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{day.training ? day.focusMuscles.slice(0, 3).join(", ") : day.note}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">Updated Weekly Sets</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {editResult.draftPlan.volume.map((item) => (
                    <div key={item.muscle} className="rounded-md border border-line bg-panel p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{item.muscle}</p>
                        <p className="text-sm text-muted">{item.plannedSets} sets</p>
                      </div>
                      <ProgressBar value={item.mrv ? (item.plannedSets / item.mrv) * 100 : 0} label={`MEV ${item.mev} | MAV ${item.mav} | MRV ${item.mrv}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <CollapsibleSection title="Weekly Set Targets by Muscle" subtitle="MEV, MAV, and MRV are estimated starting zones, not fixed rules." defaultOpen={false}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {currentPlan.volume.map((item) => (
            <div key={item.muscle} className="rounded-lg border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-ink">{item.muscle}</p>
                <p className="text-sm text-muted">{item.plannedSets} sets</p>
              </div>
              <ProgressBar value={item.mrv ? (item.plannedSets / item.mrv) * 100 : 0} label={`MEV ${item.mev} | MAV ${item.mav} | MRV ${item.mrv}`} />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <Card>
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white ring-1 ring-blue-400/40">
            <SlidersHorizontal size={18} />
          </span>
          <SectionTitle title="Weekly Adjustment Review" subtitle="Uses completed workouts, skipped sets, feedback, soreness, pain, recovery, and current MEV/MAV/MRV estimates." />
        </div>
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <div className="rounded-lg border border-line bg-surface p-3">
            <SectionTitle title="Recovery Snapshot" subtitle="Merged adaptive feedback controls." />
            <div className="mb-4 space-y-3">
              {(["pumpScore", "sessionDifficulty", "soreness", "recoveryQuality"] as const).map((key) => (
                <label key={key} className="block">
                  <span className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-[0.11em] text-muted">
                    <span>{key.replace(/([A-Z])/g, " $1")}</span>
                    <span>{feedback[key]}/10</span>
                  </span>
                  <input className="w-full accent-mineral" type="range" min="1" max="10" value={feedback[key]} onChange={(event) => setFeedback((current) => ({ ...current, [key]: Number(event.target.value) }))} />
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input className="accent-mineral" type="checkbox" checked={feedback.jointPain} onChange={(event) => setFeedback((current) => ({ ...current, jointPain: event.target.checked }))} />
                Joint pain reported
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Performance</span>
                <select className={fieldClass()} value={feedback.performanceTrend} onChange={(event) => setFeedback((current) => ({ ...current, performanceTrend: event.target.value as Feedback["performanceTrend"] }))}>
                  <option value="improved">Improved</option>
                  <option value="stable">Stayed the same</option>
                  <option value="dropped">Dropped</option>
                </select>
              </label>
              <button className={`${buttonClass("primary")} w-full`} type="button" onClick={updatePlanFromFeedback}>
                <SlidersHorizontal size={17} />
                Update Recommendations
              </button>
            </div>
            <div className="space-y-2">
              {adaptiveRecommendations({
                jointPain: feedback.jointPain,
                performanceTrend: feedback.performanceTrend,
                soreness: feedback.soreness,
                recoveryQuality: feedback.recoveryQuality
              }).map((item) => (
                <p key={item} className="rounded-lg border border-line bg-panel p-3 text-sm leading-6 text-ink">
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div>
            <div className="grid gap-3 lg:grid-cols-2">
              {weeklyRecommendations.map((item) => (
                <label key={item.id} className="flex gap-3 rounded-lg border border-line bg-surface p-3 text-sm">
                  <input
                    className="mt-1 accent-mineral"
                    type="checkbox"
                    checked={effectiveSelectedAdjustmentIds.has(item.id)}
                    onChange={(event) => {
                      const next = new Set(effectiveSelectedAdjustmentIds);
                      if (event.target.checked) next.add(item.id);
                      else next.delete(item.id);
                      setSelectedAdjustmentIds(next);
                    }}
                  />
                  <span>
                    <span className="font-semibold text-ink">{item.title}</span>
                    <span className="mt-1 block leading-6 text-muted">{item.recommendation}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{item.reason}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={buttonClass("primary")} type="button" onClick={applySelectedWeeklyAdjustments}>Apply Selected Changes</button>
              <button className={buttonClass("ghost")} type="button" onClick={() => setSelectedAdjustmentIds(new Set(weeklyRecommendations.map((item) => item.id)))}>Select All</button>
              <button className={buttonClass("ghost")} type="button" onClick={() => setSelectedAdjustmentIds(new Set())}>Reject Changes</button>
            </div>
          </div>
        </div>
      </Card>

      <CollapsibleSection title="Plan Version History" subtitle="Meaningful program changes create snapshots. Restores are previewed and checked for blocked or painful exercises." defaultOpen={false}>
        <div className="space-y-3">
          {sortedVersions.map((version) => {
            const compare = compareVersion === version.versionNumber;
            const exerciseCount = version.plan.days.reduce((total, day) => total + day.exercises.length, 0);
            const currentCount = currentPlan.days.reduce((total, day) => total + day.exercises.length, 0);
            return (
              <div key={version.versionNumber} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">Version {version.versionNumber}: {version.label}</p>
                    <p className="mt-1 text-xs text-muted">{new Date(version.timestamp).toLocaleString()}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{version.summary.join(" ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className={buttonClass("ghost")} type="button" onClick={() => setCompareVersion(compare ? null : version.versionNumber)}>Compare</button>
                    <button className={buttonClass("primary")} type="button" onClick={() => restoreVersion(version.versionNumber)}>Restore</button>
                  </div>
                </div>
                {compare ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <p className="rounded-md border border-line bg-panel p-3 text-sm text-muted">Days: {version.plan.days.length} then, {currentPlan.days.length} now</p>
                    <p className="rounded-md border border-line bg-panel p-3 text-sm text-muted">Exercises: {exerciseCount} then, {currentCount} now</p>
                    <p className="rounded-md border border-line bg-panel p-3 text-sm text-muted">Warnings: {version.plan.warnings?.length ?? 0} then, {currentPlan.warnings?.length ?? 0} now</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Program Explanation" subtitle="Why the generator made these choices, including RIR progression." defaultOpen={false}>
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div>
            <SectionTitle title="Split and Exercise Logic" />
            <div className="space-y-3">
              {currentPlan.explanation?.map((item) => (
                <p key={item} className="rounded-lg border border-line bg-surface p-3 text-sm leading-6 text-muted">{item}</p>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle title="RIR Progression" subtitle="Mesocycle progression is conservative by default." />
            <div className="space-y-3">
              {currentPlan.rirProgression?.map((item) => (
                <div key={item.week} className="rounded-lg border border-line bg-surface p-3 text-sm">
                  <p className="font-semibold text-ink">Week {item.week}: {item.targetRir}</p>
                  <p className="mt-1 leading-6 text-muted">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {currentPlan.unusedPreferredExercises?.length ? (
        <CollapsibleSection title="Preferred Exercises Not Used" subtitle="Preferred exercises are prioritized, but not forced through fatigue, pain, or recovery filters." defaultOpen={false}>
          <div className="grid gap-3 md:grid-cols-2">
            {currentPlan.unusedPreferredExercises.map((item) => (
              <div key={item.exercise} className="rounded-lg border border-line bg-surface p-3 text-sm">
                <p className="font-semibold text-ink">{item.exercise}</p>
                <p className="mt-1 leading-6 text-muted">{item.reason}</p>
                {item.alternatives.length ? <p className="mt-1 text-xs text-muted">Alternatives: {item.alternatives.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {activeWorkoutDay ? (
        <WorkoutExecutionModal
          day={activeWorkoutDay}
          logs={logs}
          sets={workoutSets}
          feedback={workoutFeedback}
          restRemaining={restRemaining}
          status={workoutStatus}
          summary={workoutSummary}
          onClose={() => setActiveWorkoutDay(null)}
          onSetChange={(id, patch) => setWorkoutSets((current) => current.map((set) => set.id === id ? { ...set, ...patch } : set))}
          onCompleteSet={completeSet}
          onSkipSet={skipSet}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onRestReset={(seconds) => setRestRemaining(seconds)}
          onFeedbackChange={setWorkoutFeedback}
          onFinish={finishWorkout}
        />
      ) : null}
    </div>
  );
}

function TextEdit({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (value: string) => void; onBlur?: () => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{label}</span>
      <input className={fieldClass()} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
    </label>
  );
}

function FitnessFeedbackPreview({
  preview,
  onChange
}: {
  preview: FitnessFeedbackAssistantPreview;
  onChange: (patch: Partial<FitnessFeedbackAssistantPreview>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Date</span>
          <input className={fieldClass()} type="date" value={preview.date} onChange={(event) => onChange({ date: event.target.value })} />
        </label>
        <TextEdit label="Title" value={preview.titleText} onChange={(titleText) => onChange({ titleText })} />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Recovery</span>
          <select className={fieldClass()} value={preview.recovery} onChange={(event) => onChange({ recovery: event.target.value as FitnessFeedbackAssistantPreview["recovery"] })}>
            <option value="good">Good</option>
            <option value="okay">Okay</option>
            <option value="poor">Poor</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Soreness</span>
          <select className={fieldClass()} value={preview.sorenessLevel} onChange={(event) => onChange({ sorenessLevel: event.target.value as FitnessFeedbackAssistantPreview["sorenessLevel"] })}>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </label>
        <NumberEdit label="Pump 1-5" value={preview.pumpQuality} onChange={(pumpQuality) => onChange({ pumpQuality })} />
        <NumberEdit label="Target Feel 1-5" value={preview.targetMuscleFeel} onChange={(targetMuscleFeel) => onChange({ targetMuscleFeel })} />
        <NumberEdit label="Difficulty 1-10" value={preview.sessionDifficulty} onChange={(sessionDifficulty) => onChange({ sessionDifficulty })} />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Performance</span>
          <select className={fieldClass()} value={preview.performance} onChange={(event) => onChange({ performance: event.target.value as FitnessFeedbackAssistantPreview["performance"] })}>
            <option value="better">Better</option>
            <option value="same">Same</option>
            <option value="worse">Worse</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Joint Pain</span>
          <select className={fieldClass()} value={preview.jointPain} onChange={(event) => onChange({ jointPain: event.target.value as FitnessFeedbackAssistantPreview["jointPain"] })}>
            <option value="none">None</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Soreness Areas</span>
          <input className={fieldClass()} value={preview.sorenessAreas.join(", ")} onChange={(event) => onChange({ sorenessAreas: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Affected Joints/Muscles</span>
          <input className={fieldClass()} value={preview.affectedAreas.join(", ")} onChange={(event) => onChange({ affectedAreas: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
        <textarea className={areaClass()} value={preview.notes} onChange={(event) => onChange({ notes: event.target.value })} />
      </label>
    </div>
  );
}

function NumberEdit({ label, value, onChange, onBlur }: { label: string; value: number; onChange: (value: number) => void; onBlur?: () => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{label}</span>
      <input className={fieldClass()} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} onBlur={onBlur} />
    </label>
  );
}

function PreviewList({
  title,
  items,
  empty,
  tone = "default"
}: {
  title: string;
  items: string[];
  empty?: string;
  tone?: "default" | "green" | "amber";
}) {
  const toneClass = tone === "green" ? "border-evergreen/30 bg-evergreen/10" : tone === "amber" ? "border-gold/30 bg-gold/10" : "border-line bg-surface";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">{title}</p>
      <div className="mt-3 space-y-2">
        {(items.length ? items : empty ? [empty] : []).map((item) => (
          <p key={item} className="rounded-md border border-line bg-panel p-3 text-sm leading-6 text-ink">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function WorkoutExecutionModal({
  day,
  logs,
  sets,
  feedback,
  restRemaining,
  status,
  summary,
  onClose,
  onSetChange,
  onCompleteSet,
  onSkipSet,
  onAddSet,
  onRemoveSet,
  onRestReset,
  onFeedbackChange,
  onFinish
}: {
  day: PlanDay;
  logs: WorkoutLogView[];
  sets: WorkoutSetDraft[];
  feedback: WorkoutFeedback;
  restRemaining: number;
  status: string | null;
  summary: ReturnType<typeof summarizeWorkoutSets> | null;
  onClose: () => void;
  onSetChange: (id: string, patch: Partial<WorkoutSetDraft>) => void;
  onCompleteSet: (id: string) => void;
  onSkipSet: (id: string) => void;
  onAddSet: (exerciseName: string) => void;
  onRemoveSet: (id: string) => void;
  onRestReset: (seconds: number) => void;
  onFeedbackChange: (feedback: WorkoutFeedback) => void;
  onFinish: () => void;
}) {
  function previousPerformance(exerciseName: string) {
    const match = logs.find((log) => log.execution?.exerciseSummaries?.some((item) => item.exerciseName === exerciseName));
    const summaryItem = match?.execution?.exerciseSummaries?.find((item) => item.exerciseName === exerciseName);
    if (!match || !summaryItem) return "No previous detail logged yet.";
    return `${match.date}: ${summaryItem.completedSets} sets, ${Math.round(summaryItem.volumeLoad)} load`;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#020617]/80 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <Card className="bg-panel">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle title={day.name} subtitle={`${day.focusMuscles.join(", ")}. Mobile-friendly execution mode.`} />
            <button className={buttonClass("ghost")} type="button" onClick={onClose}>Close</button>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">Rest Timer</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, "0")}</p>
              <div className="mt-3 flex gap-2">
                <button className={buttonClass("ghost")} type="button" onClick={() => onRestReset(0)}>Skip</button>
                <button className={buttonClass("ghost")} type="button" onClick={() => onRestReset(sets[0]?.restSeconds ?? 90)}>
                  <Timer size={15} />
                  Reset
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{sets.filter((set) => set.status === "completed").length}</p>
              <p className="mt-1 text-xs text-muted">Skipped {sets.filter((set) => set.status === "skipped").length}</p>
            </div>
            <div className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm leading-6 text-muted">
              Custom exercise set details are saved in workout log metadata when no curated Exercise row exists.
            </div>
          </div>

          <div className="space-y-4">
            {day.exercises.map((exercise) => {
              const exerciseSets = sets.filter((set) => set.exerciseName === exercise.exerciseName);
              return (
                <div key={exercise.exerciseName} className="rounded-lg border border-line bg-surface p-3">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{exercise.exerciseName}</h3>
                        {exercise.isCustom ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">Custom</span> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted">Previous: {previousPerformance(exercise.exerciseName)}</p>
                    </div>
                    <button className={buttonClass("ghost")} type="button" onClick={() => onAddSet(exercise.exerciseName)}>
                      <Plus size={15} />
                      Add Set
                    </button>
                  </div>
                  <div className="space-y-2">
                    {exerciseSets.map((set) => (
                      <div key={set.id} className="grid gap-2 rounded-md border border-line bg-panel p-2 sm:grid-cols-[70px_1fr_1fr_1fr_1.5fr_auto] sm:items-end">
                        <p className="text-sm font-semibold text-ink">Set {set.setNumber}</p>
                        <TextEdit label="Weight" value={set.weight} onChange={(value) => onSetChange(set.id, { weight: value })} />
                        <TextEdit label={`Reps (${set.targetReps})`} value={set.reps} onChange={(value) => onSetChange(set.id, { reps: value })} />
                        <TextEdit label={`RIR (${set.targetRir})`} value={set.rir} onChange={(value) => onSetChange(set.id, { rir: value })} />
                        <TextEdit label="Notes" value={set.notes} onChange={(value) => onSetChange(set.id, { notes: value })} />
                        <div className="flex flex-wrap gap-2">
                          <button className={buttonClass("primary")} type="button" onClick={() => onCompleteSet(set.id)}>Complete</button>
                          <button className={buttonClass("ghost")} type="button" onClick={() => onSkipSet(set.id)}>Skip</button>
                          <button className={buttonClass("danger")} type="button" onClick={() => onRemoveSet(set.id)}><Trash2 size={15} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-3">
              <SectionTitle title="Post-Workout Feedback" />
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberEdit label="Pump Quality 1-5" value={feedback.pumpQuality} onChange={(value) => onFeedbackChange({ ...feedback, pumpQuality: value })} />
                <NumberEdit label="Target Feel 1-5" value={feedback.targetMuscleFeel} onChange={(value) => onFeedbackChange({ ...feedback, targetMuscleFeel: value })} />
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Joint Pain</span>
                  <select className={fieldClass()} value={feedback.jointPain} onChange={(event) => onFeedbackChange({ ...feedback, jointPain: event.target.value as WorkoutFeedback["jointPain"] })}>
                    <option value="none">None</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Soreness Expected</span>
                  <select className={fieldClass()} value={feedback.sorenessExpected} onChange={(event) => onFeedbackChange({ ...feedback, sorenessExpected: event.target.value as WorkoutFeedback["sorenessExpected"] })}>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <NumberEdit label="Difficulty 1-10" value={feedback.sessionDifficulty} onChange={(value) => onFeedbackChange({ ...feedback, sessionDifficulty: value })} />
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Performance</span>
                  <select className={fieldClass()} value={feedback.performance} onChange={(event) => onFeedbackChange({ ...feedback, performance: event.target.value as WorkoutFeedback["performance"] })}>
                    <option value="better">Better</option>
                    <option value="same">Same</option>
                    <option value="worse">Worse</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Recovery</span>
                  <select className={fieldClass()} value={feedback.recovery} onChange={(event) => onFeedbackChange({ ...feedback, recovery: event.target.value as WorkoutFeedback["recovery"] })}>
                    <option value="good">Good</option>
                    <option value="okay">Okay</option>
                    <option value="poor">Poor</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
                  <textarea className={areaClass()} value={feedback.notes} onChange={(event) => onFeedbackChange({ ...feedback, notes: event.target.value })} />
                </label>
              </div>
              {feedback.jointPain !== "none" ? (
                <p className="mt-3 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm leading-6 text-ink">
                  Joint pain is flagged. SelfOS will suggest substitutions later; do not push through pain.
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={buttonClass("primary")} type="button" onClick={onFinish}>Finish Workout</button>
                {status ? <p className="self-center text-sm text-muted">{status}</p> : null}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-surface p-3">
              <SectionTitle title="Workout Summary" />
              {summary ? (
                <div className="space-y-3 text-sm">
                  <p className="rounded-md border border-line bg-panel p-3 text-ink">Completed {summary.completedSets} sets, skipped {summary.skippedSets}, total load {Math.round(summary.totalVolumeLoad)}.</p>
                  <p className="rounded-md border border-line bg-panel p-3 text-muted">Muscles trained: {summary.musclesTrained.join(", ")}</p>
                  {summary.exerciseSummaries.map((item) => (
                    <p key={item.exerciseName} className="rounded-md border border-line bg-panel p-3 text-muted">
                      {item.exerciseName}: {item.completedSets} sets, {item.skippedSets} skipped, {Math.round(item.volumeLoad)} load
                    </p>
                  ))}
                  <p className="rounded-md border border-line bg-panel p-3 text-muted">Estimated trend: {feedback.performance}. Recovery: {feedback.recovery}.</p>
                </div>
              ) : (
                <p className="rounded-md border border-line bg-panel p-3 text-sm text-muted">Finish the workout to see completed sets, skipped sets, load, muscles trained, and performance trend.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
