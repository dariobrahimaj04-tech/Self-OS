"use client";

import { Save, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Card, ProgressBar, SectionTitle } from "@/components/ui";
import { adaptiveRecommendations, generateWorkoutPlan } from "@/lib/fitness-programming";
import type { GeneratedWorkoutPlan } from "@/lib/types";

type Feedback = {
  pumpScore: number;
  targetLimited: boolean;
  jointPain: boolean;
  sessionDifficulty: number;
  soreness: number;
  performanceTrend: "improved" | "stable" | "dropped";
  recoveryQuality: number;
};

export function FitnessPlanner({ plan }: { plan: GeneratedWorkoutPlan }) {
  const [currentPlan, setCurrentPlan] = useState(plan);
  const [saved, setSaved] = useState(false);
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
      generateWorkoutPlan(undefined, {
        jointPain: feedback.jointPain,
        performanceTrend: feedback.performanceTrend,
        soreness: feedback.soreness,
        recoveryQuality: feedback.recoveryQuality
      })
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle title={currentPlan.name} subtitle={`Split: ${currentPlan.split}. Mesocycle week ${currentPlan.mesocycleWeek}.`} />
            <button
              className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90 disabled:opacity-60 sm:w-auto"
              onClick={() => setSaved(true)}
              type="button"
            >
              <Save size={17} />
              {saved ? "Saved" : "Save Plan"}
            </button>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {currentPlan.days.map((day) => (
              <div key={day.dayIndex} className="rounded-lg border border-line p-4">
                <h3 className="font-semibold text-ink">{day.name}</h3>
                <p className="mt-1 text-sm text-muted">{day.focusMuscles.join(", ")}</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-sm sm:min-w-[520px]">
                    <thead className="text-xs uppercase tracking-[0.11em] text-muted">
                      <tr>
                        <th className="border-b border-line py-2">Exercise</th>
                        <th className="border-b border-line py-2">Sets</th>
                        <th className="border-b border-line py-2">Reps</th>
                        <th className="border-b border-line py-2">RIR</th>
                        <th className="border-b border-line py-2">Rest</th>
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
    </div>
  );
}
