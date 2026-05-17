"use client";

import { AlertTriangle, Save, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Card, ProgressBar, SectionTitle } from "@/components/ui";
import { adaptiveRecommendations, generateWorkoutPlan } from "@/lib/fitness-programming";
import type { FitnessProgrammingSettings, FitnessProfileInput, GeneratedWorkoutPlan } from "@/lib/types";

type Feedback = {
  pumpScore: number;
  targetLimited: boolean;
  jointPain: boolean;
  sessionDifficulty: number;
  soreness: number;
  performanceTrend: "improved" | "stable" | "dropped";
  recoveryQuality: number;
};

export function FitnessPlanner({
  plan,
  profile,
  settings
}: {
  plan: GeneratedWorkoutPlan;
  profile: FitnessProfileInput;
  settings?: FitnessProgrammingSettings | null;
}) {
  const [currentPlan, setCurrentPlan] = useState(plan);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({
    pumpScore: 7,
    targetLimited: true,
    jointPain: false,
    sessionDifficulty: 7,
    soreness: 4,
    performanceTrend: "stable",
    recoveryQuality: 7
  });

  function updatePlanFromFeedback() {
    setCurrentPlan(
      generateWorkoutPlan(profile, {
        jointPain: feedback.jointPain,
        performanceTrend: feedback.performanceTrend,
        soreness: feedback.soreness,
        recoveryQuality: feedback.recoveryQuality
      }, settings ?? undefined)
    );
  }

  async function savePlan() {
    setSaveStatus("Saving...");
    const response = await fetch("/api/fitness/program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentPlan)
    });
    setSaveStatus(response.ok ? "Program saved to your account." : "Could not save the program.");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle title={currentPlan.name} subtitle={`Split: ${currentPlan.split}. Mesocycle week ${currentPlan.mesocycleWeek}.`} />
            <button
              className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90 disabled:opacity-60 sm:w-auto"
              onClick={savePlan}
              type="button"
            >
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{day.name}</h3>
                    <p className="mt-1 text-sm text-muted">{day.focusMuscles.join(", ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-line bg-surface px-2 py-1 text-muted">{day.fatigueLevel} fatigue</span>
                    <span className="rounded-full border border-line bg-surface px-2 py-1 text-muted">{day.spinalLoading} spinal</span>
                  </div>
                </div>
                {day.recoveryRole ? <p className="mt-2 text-xs leading-5 text-muted">{day.recoveryRole}</p> : null}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.11em] text-muted">
                      <tr>
                        <th className="border-b border-line py-2">Exercise</th>
                        <th className="border-b border-line py-2">Sets</th>
                        <th className="border-b border-line py-2">Reps</th>
                        <th className="border-b border-line py-2">RIR</th>
                        <th className="border-b border-line py-2">Rest</th>
                        <th className="border-b border-line py-2">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.exercises.map((exercise) => (
                        <tr key={`${day.dayIndex}-${exercise.exerciseName}`}>
                          <td className="border-b border-line py-2 pr-3">
                            <span className="font-medium">{exercise.exerciseName}</span>
                            <span className="block text-xs text-muted">{exercise.rationale}</span>
                          </td>
                          <td className="border-b border-line py-2">{exercise.sets}</td>
                          <td className="border-b border-line py-2">{exercise.repRange}</td>
                          <td className="border-b border-line py-2">{exercise.targetRir}</td>
                          <td className="border-b border-line py-2">{exercise.restSeconds}s</td>
                          <td className="border-b border-line py-2 text-muted">{exercise.advancedMethod ?? "Standard"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Post-Workout Feedback" subtitle="Used for adaptive volume and substitution recommendations." />
          <div className="space-y-4">
            {(["pumpScore", "sessionDifficulty", "soreness", "recoveryQuality"] as const).map((key) => (
              <label key={key} className="block">
                <span className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-[0.11em] text-muted">
                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                  <span>{feedback[key]}/10</span>
                </span>
                <input
                  className="w-full accent-mineral"
                  type="range"
                  min="1"
                  max="10"
                  value={feedback[key]}
                  onChange={(event) => setFeedback((current) => ({ ...current, [key]: Number(event.target.value) }))}
                />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                className="accent-mineral"
                type="checkbox"
                checked={feedback.targetLimited}
                onChange={(event) => setFeedback((current) => ({ ...current, targetLimited: event.target.checked }))}
              />
              Target muscle was limiting
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                className="accent-mineral"
                type="checkbox"
                checked={feedback.jointPain}
                onChange={(event) => setFeedback((current) => ({ ...current, jointPain: event.target.checked }))}
              />
              Joint pain reported
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Performance</span>
              <select
                className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink"
                value={feedback.performanceTrend}
                onChange={(event) => setFeedback((current) => ({ ...current, performanceTrend: event.target.value as Feedback["performanceTrend"] }))}
              >
                <option value="improved">Improved</option>
                <option value="stable">Stayed the same</option>
                <option value="dropped">Dropped</option>
              </select>
            </label>
            <button
              className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90"
              type="button"
              onClick={updatePlanFromFeedback}
            >
              <SlidersHorizontal size={17} />
              Update Recommendations
            </button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <SectionTitle title="Weekly Set Targets by Muscle" subtitle="MEV, MAV, and MRV are estimated starting zones, not fixed rules." />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {currentPlan.volume.map((item) => (
              <div key={item.muscle} className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-ink">{item.muscle}</p>
                  <p className="text-sm text-muted">{item.plannedSets} sets</p>
                </div>
                <ProgressBar value={(item.plannedSets / item.mrv) * 100} label={`MEV ${item.mev} | MAV ${item.mav} | MRV ${item.mrv}`} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Adaptive Recommendations" />
          <div className="space-y-3">
            {adaptiveRecommendations({
              jointPain: feedback.jointPain,
              performanceTrend: feedback.performanceTrend,
              soreness: feedback.soreness,
              recoveryQuality: feedback.recoveryQuality
            }).map((item) => (
              <p key={item} className="rounded-lg border border-line bg-surface p-3 text-sm leading-6 text-ink">
                {item}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <SectionTitle title="Program Explanation" subtitle="Why the generator made these choices." />
          <div className="space-y-3">
            {currentPlan.explanation?.map((item) => (
              <p key={item} className="rounded-lg border border-line bg-surface p-3 text-sm leading-6 text-muted">{item}</p>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="RIR Progression" subtitle="Mesocycle progression is conservative by default." />
          <div className="space-y-3">
            {currentPlan.rirProgression?.map((item) => (
              <div key={item.week} className="rounded-lg border border-line bg-surface p-3 text-sm">
                <p className="font-semibold text-ink">Week {item.week}: {item.targetRir}</p>
                <p className="mt-1 leading-6 text-muted">{item.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {currentPlan.unusedPreferredExercises?.length ? (
        <Card>
          <SectionTitle title="Preferred Exercises Not Used" subtitle="Preferred exercises are prioritized, but not forced through fatigue, pain, or recovery filters." />
          <div className="grid gap-3 md:grid-cols-2">
            {currentPlan.unusedPreferredExercises.map((item) => (
              <div key={item.exercise} className="rounded-lg border border-line bg-surface p-3 text-sm">
                <p className="font-semibold text-ink">{item.exercise}</p>
                <p className="mt-1 leading-6 text-muted">{item.reason}</p>
                {item.alternatives.length ? <p className="mt-1 text-xs text-muted">Alternatives: {item.alternatives.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
