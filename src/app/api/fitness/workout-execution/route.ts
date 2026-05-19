import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";
import type { PlanDay } from "@/lib/types";

type ExecutionSet = {
  exerciseName: string;
  setNumber: number;
  status: "completed" | "skipped";
  reps?: number;
  weight?: number;
  rir?: number;
  restSeconds?: number;
  notes?: string;
  isCustom?: boolean;
};

type ExecutionBody = {
  day?: PlanDay;
  workoutPlanId?: string;
  durationMinutes?: number;
  notes?: string;
  sets?: ExecutionSet[];
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

const sorenessScore = { low: 3, moderate: 6, high: 8 };
const recoveryScore = { good: 8, okay: 6, poor: 3 };
const performanceTrend = { better: "improved", same: "stable", worse: "dropped" } as const;

export async function POST(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as ExecutionBody | null;
  if (!body?.day?.name || !body.sets?.length) {
    return NextResponse.json({ error: "Workout day and set data are required." }, { status: 400 });
  }

  const completedSets = body.sets.filter((set) => set.status === "completed");
  const skippedSets = body.sets.filter((set) => set.status === "skipped");
  const exerciseNames = Array.from(new Set(completedSets.filter((set) => !set.isCustom).map((set) => set.exerciseName)));
  const prisma = getPrisma();
  const exercises = await prisma.exercise.findMany({ where: { name: { in: exerciseNames } } });
  const exerciseByName = new Map(exercises.map((exercise) => [exercise.name, exercise.id]));
  const totalVolumeLoad = completedSets.reduce((total, set) => total + (set.weight ?? 0) * (set.reps ?? 0), 0);
  const musclesTrained = Array.from(new Set(body.day.focusMuscles ?? []));
  const exerciseSummaries = body.day.exercises.map((exercise) => {
    const exerciseSets = body.sets?.filter((set) => set.exerciseName === exercise.exerciseName) ?? [];
    return {
      exerciseName: exercise.exerciseName,
      completedSets: exerciseSets.filter((set) => set.status === "completed").length,
      skippedSets: exerciseSets.filter((set) => set.status === "skipped").length,
      volumeLoad: exerciseSets.reduce((total, set) => total + (set.weight ?? 0) * (set.reps ?? 0), 0),
      notes: exerciseSets.map((set) => set.notes).filter(Boolean).join(" | ") || undefined,
      isCustom: Boolean(exercise.isCustom)
    };
  });
  const customSetCount = completedSets.filter((set) => set.isCustom || !exerciseByName.has(set.exerciseName)).length;
  const metadata = {
    dayName: body.day.name,
    completedSets: completedSets.length,
    skippedSets: skippedSets.length,
    totalVolumeLoad,
    musclesTrained,
    exerciseSummaries,
    customSetCount,
    customStorageNote:
      customSetCount > 0
        ? "Custom exercise set details are stored in WorkoutLog.notes metadata because WorkoutSet requires a curated Exercise row."
        : undefined,
    feedback: body.feedback,
    notes: body.notes
  };

  const log = await prisma.workoutLog.create({
    data: {
      userId: user.id,
      workoutPlanId: body.workoutPlanId,
      date: new Date(),
      title: body.day.name,
      durationMinutes: body.durationMinutes,
      sessionDifficulty: body.feedback?.sessionDifficulty,
      performanceTrend: performanceTrend[body.feedback?.performance ?? "same"],
      notes: `SELFOS_EXECUTION:${JSON.stringify(metadata)}`,
      sets: {
        create: completedSets
          .map((set) => {
            const exerciseId = exerciseByName.get(set.exerciseName);
            if (!exerciseId) return null;
            const volumeLoad = (set.weight ?? 0) * (set.reps ?? 0);
            return {
              exerciseId,
              setNumber: set.setNumber,
              reps: Math.max(0, Math.round(set.reps ?? 0)),
              weight: set.weight ?? 0,
              rir: set.rir,
              restSeconds: set.restSeconds,
              notes: set.notes,
              volumeLoad,
              estimatedOneRepMax: set.reps && set.weight ? set.weight * (1 + set.reps / 30) : undefined
            };
          })
          .filter((set): set is NonNullable<typeof set> => Boolean(set))
      },
      feedback: body.feedback
        ? {
            create: {
              pumpScore: body.feedback.pumpQuality ?? 3,
              targetLimited: (body.feedback.targetMuscleFeel ?? 3) >= 3,
              jointPain: body.feedback.jointPain !== "none",
              jointPainNotes:
                body.feedback.jointPain && body.feedback.jointPain !== "none"
                  ? `${body.feedback.jointPain} joint pain reported. Do not push through pain. ${body.feedback.notes ?? ""}`.trim()
                  : undefined,
              sessionDifficulty: body.feedback.sessionDifficulty ?? 5,
              soreness: sorenessScore[body.feedback.sorenessExpected ?? "moderate"],
              performanceTrend: performanceTrend[body.feedback.performance ?? "same"],
              recoveryQuality: recoveryScore[body.feedback.recovery ?? "okay"],
              notes: body.feedback.notes
            }
          }
        : undefined
    }
  });

  return NextResponse.json({ data: { id: log.id, summary: metadata } }, { status: 201 });
}
