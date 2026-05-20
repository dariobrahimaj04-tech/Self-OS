import { FitnessProgrammingWorkspace } from "@/components/fitness-programming-workspace";
import { CrudPanel } from "@/components/crud-panel";
import { CollapsibleSection } from "@/components/collapsible-section";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { curatedExerciseLibrary } from "@/lib/fitness-programming";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

export default async function FitnessPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const profile = data.fitnessProfile;
  const topExercises = curatedExerciseLibrary
    .map((exercise) => ({
      ...exercise,
      score: exercise.hypertrophyRating * 2 + exercise.stabilityRating + exercise.rangeOfMotionRating + exercise.jointFriendliness - exercise.fatigueCost
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Evidence-based planner"
        title="Fitness Planner and Workout Tracker"
        description="RP-inspired evidence-based hypertrophy programming built around weekly volume, RIR, fatigue management, recovery feedback, and joint-friendly exercise selection."
      />
      <FitnessProgrammingWorkspace initialProfile={profile} initialSettings={data.fitnessSettings} initialPlan={data.activeWorkoutPlan} initialWorkoutLogs={data.workoutLogs} />
      <div className="mt-5">
        <Card>
          <SectionTitle title="Recent Workout Logs" subtitle="Latest saved workouts and assistant feedback." />
          {data.workoutLogs.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.workoutLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="rounded-lg border border-line bg-surface p-3">
                  <p className="font-semibold text-ink">{log.title}</p>
                  <p className="mt-1 text-xs text-muted">{log.date}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Difficulty {log.sessionDifficulty || "-"} | Performance {log.performanceTrend || "not set"}
                  </p>
                  {log.feedback?.jointPain && log.feedback.jointPain !== "none" ? (
                    <p className="mt-2 rounded-md border border-ember/30 bg-ember/10 px-2 py-1 text-xs text-ink">
                      Joint pain flagged: review substitutions.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">
              No workout logs yet. Start a workout from your current program or add a manual entry below.
            </p>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <CollapsibleSection title="Curated Exercise Library Sample" subtitle="Scored for stimulus, stability, range of motion, fatigue cost, and joint friendliness." defaultOpen={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm sm:min-w-[760px]">
              <thead className="text-xs uppercase tracking-[0.11em] text-muted">
                <tr>
                  <th className="border-b border-line py-2">Exercise</th>
                  <th className="border-b border-line py-2">Muscle</th>
                  <th className="border-b border-line py-2">Equipment</th>
                  <th className="border-b border-line py-2">Reps</th>
                  <th className="border-b border-line py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {topExercises.map((exercise) => (
                  <tr key={exercise.name}>
                    <td className="border-b border-line py-2 font-medium">{exercise.name}</td>
                    <td className="border-b border-line py-2">{exercise.primaryMuscle}</td>
                    <td className="border-b border-line py-2">{exercise.equipment.join(", ")}</td>
                    <td className="border-b border-line py-2">{exercise.suggestedRepRange}</td>
                    <td className="border-b border-line py-2">{exercise.score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
        <CollapsibleSection title="Programming Guardrails" defaultOpen={false}>
          <div className="space-y-3 text-sm leading-6 text-muted">
            <p>Beginners start with lower weekly volume; intermediate and advanced users get more volume only when recovery and performance support it.</p>
            <p>Most hypertrophy work stays in 5-30 reps and 0-4 RIR. Strength-focused main lifts use lower reps, while accessories stay moderate to high.</p>
            <p>Repeated joint pain suggests substitution and volume reduction. Persistent pain or injuries should be handled with a qualified professional.</p>
          </div>
        </CollapsibleSection>
      </div>
      <div className="mt-5">
        <CollapsibleSection title="Manual Workout Log Entry" subtitle="Use this for quick backfilled workouts. Day execution mode remains available from the current program." defaultOpen={false} contentMode="outside">
          <CrudPanel
            title="Workout Log"
            resource="workoutLogs"
            initialRows={data.workoutLogs.map((log) => ({
              id: log.id,
              date: log.date,
              title: log.title,
              durationMinutes: log.durationMinutes,
              sessionDifficulty: log.sessionDifficulty,
              performanceTrend: log.performanceTrend,
              notes: log.notes
            }))}
            fields={[
              { name: "date", label: "Date", type: "date", required: true },
              { name: "title", label: "Workout Title", required: true },
              { name: "durationMinutes", label: "Duration Minutes", type: "number" },
              { name: "sessionDifficulty", label: "Session Difficulty", type: "number" },
              { name: "performanceTrend", label: "Performance", type: "select", options: ["improved", "stable", "dropped"] },
              { name: "notes", label: "Notes", type: "textarea" }
            ]}
            columns={[
              { key: "date", label: "Date" },
              { key: "title", label: "Workout" },
              { key: "durationMinutes", label: "Minutes" },
              { key: "sessionDifficulty", label: "Difficulty" },
              { key: "performanceTrend", label: "Performance" },
              { key: "notes", label: "Notes" }
            ]}
          />
        </CollapsibleSection>
      </div>
    </>
  );
}
