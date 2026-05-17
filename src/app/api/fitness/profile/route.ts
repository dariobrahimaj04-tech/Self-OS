import { NextResponse } from "next/server";
import { normalizeDates } from "@/lib/api-resources";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";
import { fitnessProfileSchema } from "@/lib/validators";

export async function PUT(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = fitnessProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const prisma = getPrisma();
  const profile = await prisma.fitnessProfile.upsert({
    where: { userId: user.id },
    update: {
      age: data.age ?? 30,
      heightCm: data.heightCm ?? 175,
      weightKg: data.weightKg ?? 75,
      trainingExperience: data.trainingExperience,
      monthsOrYearsTraining: data.monthsOrYearsTraining,
      primaryGoal: data.primaryGoal,
      secondaryGoal: data.secondaryGoal,
      daysAvailablePerWeek: data.daysAvailablePerWeek,
      preferredWorkoutDuration: data.preferredWorkoutDuration,
      availableEquipment: data.availableEquipment,
      weakMuscleGroups: data.weakMuscleGroups,
      injuriesOrLimitations: data.injuriesOrLimitations,
      sleepAverage: data.sleepAverage,
      stressLevel: data.stressLevel,
      recoveryQuality: data.recoveryQuality,
      preferredSplit: data.preferredSplit,
      preferredExercises: data.preferredExercises,
      favoriteExercises: data.favoriteExercises,
      blockedExercises: data.blockedExercises,
      painfulExercises: data.painfulExercises,
      allowAdvancedExercises: data.allowAdvancedExercises,
      allowMyoReps: data.allowMyoReps,
      allowLengthenedPartials: data.allowLengthenedPartials,
      allowBarbellCompounds: data.allowBarbellCompounds,
      allowHighSpinalLoading: data.allowHighSpinalLoadingExercises,
      progressionStyle: data.preferredProgressionStyle,
      benchPressEstimate: data.strengthNumbers?.benchPress,
      squatEstimate: data.strengthNumbers?.squat,
      deadliftEstimate: data.strengthNumbers?.deadlift,
      overheadPressEstimate: data.strengthNumbers?.overheadPress
    },
    create: {
      userId: user.id,
      age: data.age ?? 30,
      heightCm: data.heightCm ?? 175,
      weightKg: data.weightKg ?? 75,
      trainingExperience: data.trainingExperience,
      monthsOrYearsTraining: data.monthsOrYearsTraining,
      primaryGoal: data.primaryGoal,
      secondaryGoal: data.secondaryGoal,
      daysAvailablePerWeek: data.daysAvailablePerWeek,
      preferredWorkoutDuration: data.preferredWorkoutDuration,
      availableEquipment: data.availableEquipment,
      weakMuscleGroups: data.weakMuscleGroups,
      injuriesOrLimitations: data.injuriesOrLimitations,
      sleepAverage: data.sleepAverage,
      stressLevel: data.stressLevel,
      recoveryQuality: data.recoveryQuality,
      preferredSplit: data.preferredSplit,
      preferredExercises: data.preferredExercises,
      favoriteExercises: data.favoriteExercises,
      blockedExercises: data.blockedExercises,
      painfulExercises: data.painfulExercises,
      allowAdvancedExercises: data.allowAdvancedExercises,
      allowMyoReps: data.allowMyoReps,
      allowLengthenedPartials: data.allowLengthenedPartials,
      allowBarbellCompounds: data.allowBarbellCompounds,
      allowHighSpinalLoading: data.allowHighSpinalLoadingExercises,
      progressionStyle: data.preferredProgressionStyle,
      benchPressEstimate: data.strengthNumbers?.benchPress,
      squatEstimate: data.strengthNumbers?.squat,
      deadliftEstimate: data.strengthNumbers?.deadlift,
      overheadPressEstimate: data.strengthNumbers?.overheadPress
    }
  });

  return NextResponse.json({ data: profile });
}

export async function GET(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const profile = await getPrisma().fitnessProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ data: profile ? normalizeDates(profile, []) : null });
}
