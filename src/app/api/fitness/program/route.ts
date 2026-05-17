import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";
import type { GeneratedWorkoutPlan } from "@/lib/types";

export async function POST(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const plan = (await request.json().catch(() => null)) as GeneratedWorkoutPlan | null;
  if (!plan?.days?.length) {
    return NextResponse.json({ error: "A generated program is required" }, { status: 400 });
  }

  const prisma = getPrisma();
  const exerciseNames = plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseName));
  const exercises = await prisma.exercise.findMany({ where: { name: { in: exerciseNames } } });
  const exerciseByName = new Map(exercises.map((exercise) => [exercise.name, exercise.id]));

  const savedPlan = await prisma.workoutPlan.create({
    data: {
      userId: user.id,
      name: plan.name,
      goal: "hypertrophy",
      split: plan.split,
      mesocycleWeek: plan.mesocycleWeek,
      startDate: new Date(),
      notes: [...(plan.explanation ?? []), ...(plan.warnings ?? []), ...(plan.notes ?? [])].join("\n"),
      volumeTargets: plan.volume as unknown as Prisma.InputJsonValue,
      days: {
        create: plan.days.map((day) => ({
          dayIndex: day.dayIndex,
          name: day.name,
          focusMuscles: day.focusMuscles,
          targetRir: Math.round(day.exercises[0]?.targetRir ?? 3),
          notes: day.recoveryRole,
          exercises: {
            create: day.exercises
              .map((exercise, index) => {
                const exerciseId = exerciseByName.get(exercise.exerciseName);
                if (!exerciseId) return null;
                const [minReps, maxReps] = exercise.repRange
                  .split("-")
                  .map((part) => Number.parseInt(part, 10))
                  .filter(Number.isFinite);
                return {
                  exerciseId,
                  order: index + 1,
                  sets: exercise.sets,
                  minReps: minReps || 8,
                  maxReps: maxReps || minReps || 15,
                  targetRir: Math.round(exercise.targetRir),
                  restSeconds: exercise.restSeconds,
                  notes: [exercise.rationale, exercise.advancedMethod].filter(Boolean).join(" ")
                };
              })
              .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
          }
        }))
      }
    }
  });

  return NextResponse.json({ data: savedPlan }, { status: 201 });
}
