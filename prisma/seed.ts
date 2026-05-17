import { PrismaClient } from "@prisma/client";
import { curatedExerciseLibrary, defaultFitnessSettings, generateWorkoutPlan } from "../src/lib/fitness-programming";
import {
  checkIns,
  demoUser,
  financeTransactions,
  fitnessProfile,
  goals,
  habits,
  insights,
  journalEntries,
  learningItems,
  meals,
  moodLogs,
  workoutLogs
} from "../src/lib/mock-data";

const prisma = new PrismaClient();

const toDate = (value: string) => new Date(`${value}T12:00:00.000Z`);

async function clearDemoData(userId: string) {
  await prisma.postWorkoutFeedback.deleteMany({ where: { workoutLog: { userId } } });
  await prisma.workoutSet.deleteMany({ where: { workoutLog: { userId } } });
  await prisma.workoutLog.deleteMany({ where: { userId } });
  await prisma.workoutExercise.deleteMany({ where: { workoutDay: { plan: { userId } } } });
  await prisma.workoutDay.deleteMany({ where: { plan: { userId } } });
  await prisma.workoutPlan.deleteMany({ where: { userId } });
  await prisma.muscleVolumeTarget.deleteMany({ where: { userId } });
  await prisma.fitnessProfile.deleteMany({ where: { userId } });
  await prisma.fitnessProgrammingSettings.deleteMany({ where: { userId } });
  await prisma.meal.deleteMany({ where: { userId } });
  await prisma.foodTemplate.deleteMany({ where: { userId } });
  await prisma.dailyCheckIn.deleteMany({ where: { userId } });
  await prisma.moodLog.deleteMany({ where: { userId } });
  await prisma.journalEntry.deleteMany({ where: { userId } });
  await prisma.habitLog.deleteMany({ where: { userId } });
  await prisma.goalMilestone.deleteMany({ where: { goal: { userId } } });
  await prisma.goalTask.deleteMany({ where: { goal: { userId } } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.habit.deleteMany({ where: { userId } });
  await prisma.learningLog.deleteMany({ where: { userId } });
  await prisma.learningItem.deleteMany({ where: { userId } });
  await prisma.financeTransaction.deleteMany({ where: { userId } });
  await prisma.savingsGoal.deleteMany({ where: { userId } });
  await prisma.weeklyReview.deleteMany({ where: { userId } });
  await prisma.insight.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: demoUser.email },
    update: {
      name: demoUser.name,
      emailVerified: true
    },
    create: {
      email: demoUser.email,
      name: demoUser.name,
      emailVerified: true
    }
  });

  await clearDemoData(user.id);

  await prisma.fitnessProfile.create({
    data: {
      userId: user.id,
      age: fitnessProfile.age,
      heightCm: fitnessProfile.heightCm,
      weightKg: fitnessProfile.weightKg,
      trainingExperience: fitnessProfile.trainingExperience,
      monthsOrYearsTraining: fitnessProfile.monthsOrYearsTraining,
      primaryGoal: fitnessProfile.primaryGoal,
      secondaryGoal: fitnessProfile.secondaryGoal,
      daysAvailablePerWeek: fitnessProfile.daysAvailablePerWeek,
      preferredWorkoutDuration: fitnessProfile.preferredWorkoutDuration,
      availableEquipment: fitnessProfile.availableEquipment,
      weakMuscleGroups: fitnessProfile.weakMuscleGroups,
      injuriesOrLimitations: fitnessProfile.injuriesOrLimitations,
      sleepAverage: fitnessProfile.sleepAverage,
      stressLevel: fitnessProfile.stressLevel,
      recoveryQuality: fitnessProfile.recoveryQuality,
      preferredSplit: fitnessProfile.preferredSplit,
      preferredExercises: fitnessProfile.preferredExercises ?? [],
      favoriteExercises: fitnessProfile.favoriteExercises ?? [],
      blockedExercises: fitnessProfile.blockedExercises ?? [],
      painfulExercises: fitnessProfile.painfulExercises ?? [],
      allowAdvancedExercises: fitnessProfile.allowAdvancedExercises ?? false,
      allowMyoReps: fitnessProfile.allowMyoReps ?? false,
      allowLengthenedPartials: fitnessProfile.allowLengthenedPartials ?? false,
      allowBarbellCompounds: fitnessProfile.allowBarbellCompounds ?? true,
      allowHighSpinalLoading: fitnessProfile.allowHighSpinalLoadingExercises ?? false,
      progressionStyle: fitnessProfile.preferredProgressionStyle ?? "double progression",
      benchPressEstimate: fitnessProfile.strengthNumbers.benchPress,
      squatEstimate: fitnessProfile.strengthNumbers.squat,
      deadliftEstimate: fitnessProfile.strengthNumbers.deadlift,
      overheadPressEstimate: fitnessProfile.strengthNumbers.overheadPress
    }
  });

  await prisma.fitnessProgrammingSettings.create({
    data: {
      userId: user.id,
      preferredSplit: defaultFitnessSettings.preferredSplit,
      trainingDays: defaultFitnessSettings.trainingDays,
      mesocycleLength: defaultFitnessSettings.mesocycleLength,
      defaultRirProgression: defaultFitnessSettings.defaultRirProgression,
      defaultMinSets: defaultFitnessSettings.defaultMinSets,
      defaultMaxSets: defaultFitnessSettings.defaultMaxSets,
      preferredExercises: ["Machine Chest Press", "Lat Pulldown", "Hack Squat"],
      favoriteExercises: ["Cable Lateral Raise", "Seated Leg Curl"],
      blockedExercises: [],
      painfulExercises: ["Dips"],
      allowAdvancedExercises: false,
      allowMyoReps: false,
      allowLengthenedPartials: false,
      allowBarbellCompounds: true,
      allowHighSpinalLoading: false,
      weakMusclePriorities: fitnessProfile.weakMuscleGroups,
      useAbVariation: true,
      preferredProgressionStyle: defaultFitnessSettings.preferredProgressionStyle,
      deloadTriggerSensitivity: defaultFitnessSettings.deloadTriggerSensitivity
    }
  });

  for (const exercise of curatedExerciseLibrary) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles,
        movementPattern: exercise.movementPattern,
        equipment: exercise.equipment,
        difficultyLevel: exercise.difficultyLevel,
        experienceTier: exercise.experienceTier,
        technicalDifficulty: exercise.technicalDifficulty,
        hypertrophyRating: exercise.hypertrophyRating,
        strengthRating: exercise.strengthRating,
        stabilityRating: exercise.stabilityRating,
        rangeOfMotion: exercise.rangeOfMotion,
        rangeOfMotionRating: exercise.rangeOfMotionRating,
        fatigueCost: exercise.fatigueCost,
        spinalLoading: exercise.spinalLoading,
        systemicFatigue: exercise.systemicFatigue,
        jointStress: exercise.jointStress,
        jointFriendliness: exercise.jointFriendliness,
        notes: exercise.notes,
        cautions: exercise.cautions,
        suggestedRepRange: exercise.suggestedRepRange,
        suggestedRestRange: exercise.suggestedRestRange,
        advancedMethodAllowed: exercise.advancedMethodAllowed,
        alternatives: exercise.alternatives
      },
      create: {
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles,
        movementPattern: exercise.movementPattern,
        equipment: exercise.equipment,
        difficultyLevel: exercise.difficultyLevel,
        experienceTier: exercise.experienceTier,
        technicalDifficulty: exercise.technicalDifficulty,
        hypertrophyRating: exercise.hypertrophyRating,
        strengthRating: exercise.strengthRating,
        stabilityRating: exercise.stabilityRating,
        rangeOfMotion: exercise.rangeOfMotion,
        rangeOfMotionRating: exercise.rangeOfMotionRating,
        fatigueCost: exercise.fatigueCost,
        spinalLoading: exercise.spinalLoading,
        systemicFatigue: exercise.systemicFatigue,
        jointStress: exercise.jointStress,
        jointFriendliness: exercise.jointFriendliness,
        notes: exercise.notes,
        cautions: exercise.cautions,
        suggestedRepRange: exercise.suggestedRepRange,
        suggestedRestRange: exercise.suggestedRestRange,
        advancedMethodAllowed: exercise.advancedMethodAllowed,
        alternatives: exercise.alternatives
      }
    });
  }

  const exerciseRows = await prisma.exercise.findMany();
  const exerciseIdByName = new Map(exerciseRows.map((exercise) => [exercise.name, exercise.id]));
  const plan = generateWorkoutPlan(fitnessProfile);

  const workoutPlan = await prisma.workoutPlan.create({
    data: {
      userId: user.id,
      name: plan.name,
      goal: fitnessProfile.primaryGoal,
      split: plan.split,
      mesocycleWeek: plan.mesocycleWeek,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 56),
      notes: plan.notes.join("\n"),
      volumeTargets: plan.volume
    }
  });

  for (const item of plan.volume) {
    await prisma.muscleVolumeTarget.create({
      data: {
        userId: user.id,
        muscle: item.muscle,
        mev: item.mev,
        mav: item.mav,
        mrv: item.mrv,
        currentSets: item.plannedSets,
        recommendedSets: item.plannedSets,
        notes: item.recommendation
      }
    });
  }

  for (const day of plan.days) {
    const workoutDay = await prisma.workoutDay.create({
      data: {
        planId: workoutPlan.id,
        dayIndex: day.dayIndex,
        name: day.name,
        focusMuscles: day.focusMuscles,
        targetRir: day.exercises[0]?.targetRir ?? 2
      }
    });

    for (const [index, exercise] of day.exercises.entries()) {
      const exerciseId = exerciseIdByName.get(exercise.exerciseName);
      if (!exerciseId) continue;
      const [minReps, maxReps] = exercise.repRange
        .split("-")
        .map((part) => Number.parseInt(part, 10))
        .filter(Number.isFinite);

      await prisma.workoutExercise.create({
        data: {
          workoutDayId: workoutDay.id,
          exerciseId,
          order: index + 1,
          sets: exercise.sets,
          minReps: minReps || 8,
          maxReps: maxReps || minReps || 15,
          targetRir: exercise.targetRir,
          restSeconds: exercise.restSeconds,
          notes: exercise.rationale
        }
      });
    }
  }

  for (const meal of meals) {
    await prisma.meal.create({
      data: {
        userId: user.id,
        date: toDate(meal.date),
        mealType: meal.mealType,
        foodName: meal.foodName,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        waterLiters: meal.waterLiters,
        notes: meal.notes,
        energyImpact: meal.energyImpact,
        favorite: meal.favorite ?? false
      }
    });
  }

  await prisma.foodTemplate.createMany({
    data: [
      { userId: user.id, name: "Greek yogurt bowl", mealType: "Breakfast", calories: 510, protein: 42, carbs: 58, fats: 12, waterLiters: 0.5, notes: "Favorite high-protein breakfast." },
      { userId: user.id, name: "Turkey chili", mealType: "Dinner", calories: 680, protein: 52, carbs: 68, fats: 18, waterLiters: 0.5, notes: "Batch-cook template." }
    ]
  });

  for (const entry of checkIns) {
    await prisma.dailyCheckIn.create({
      data: {
        userId: user.id,
        date: toDate(entry.date),
        moodScore: entry.moodScore,
        energyScore: entry.energyScore,
        stressScore: entry.stressScore,
        sleepHours: entry.sleepHours,
        sleepQuality: entry.sleepQuality,
        productivityScore: entry.productivityScore,
        socialConnectionScore: entry.socialConnectionScore,
        waterIntakeLiters: entry.waterIntakeLiters,
        notes: entry.notes
      }
    });
  }

  for (const log of moodLogs) {
    await prisma.moodLog.create({
      data: {
        userId: user.id,
        date: toDate(log.date),
        mood: log.mood,
        energy: log.energy,
        stress: log.stress,
        sleepQuality: log.sleepQuality,
        socialConnection: log.socialConnection,
        anxietyLevel: log.anxietyLevel,
        productivity: log.productivity,
        notes: log.notes
      }
    });
  }

  for (const entry of journalEntries) {
    await prisma.journalEntry.create({
      data: {
        userId: user.id,
        date: toDate(entry.date),
        mode: entry.mode,
        title: entry.title,
        content: entry.content,
        completed: entry.completed
      }
    });
  }

  for (const habit of habits) {
    const created = await prisma.habit.create({
      data: {
        userId: user.id,
        name: habit.name,
        category: habit.category,
        frequency: habit.frequency,
        targetDays: habit.targetDays,
        notes: habit.notes
      }
    });

    for (let index = 0; index < 7; index += 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      await prisma.habitLog.create({
        data: {
          userId: user.id,
          habitId: created.id,
          date,
          completed: index === 0 ? habit.completedToday : index < Math.round(habit.weeklyCompletion / 14),
          skipReason: index === 0 || habit.completedToday ? undefined : "Low recovery day",
          notes: index === 0 && !habit.completedToday ? "Still open today." : undefined
        }
      });
    }
  }

  for (const goal of goals) {
    await prisma.goal.create({
      data: {
        userId: user.id,
        title: goal.title,
        category: goal.category,
        description: goal.description,
        startDate: toDate(goal.startDate),
        targetDate: toDate(goal.targetDate),
        priority: goal.priority,
        status: goal.status,
        progressPercentage: goal.progressPercentage,
        weeklyReviewNotes: goal.weeklyReviewNotes,
        milestones: {
          create: goal.milestones.map((title, index) => ({
            title,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (index + 1) * 21),
            completed: index === 0,
            completedAt: index === 0 ? new Date() : undefined
          }))
        },
        tasks: {
          create: goal.tasks.map((title, index) => ({
            title,
            completed: index === 0,
            completedAt: index === 0 ? new Date() : undefined
          }))
        }
      }
    });
  }

  for (const item of learningItems) {
    const created = await prisma.learningItem.create({
      data: {
        userId: user.id,
        name: item.name,
        category: item.category,
        currentLevel: item.currentLevel,
        targetLevel: item.targetLevel,
        studyMinutes: item.studyMinutes,
        resourceLink: item.resourceLink,
        notes: item.notes,
        confidenceScore: item.confidenceScore,
        relatedProjects: item.relatedProjects,
        completionPercentage: item.completionPercentage
      }
    });
    await prisma.learningLog.create({
      data: {
        userId: user.id,
        learningItemId: created.id,
        date: new Date(),
        studyMinutes: Math.min(90, item.studyMinutes),
        confidenceScore: item.confidenceScore,
        notes: "Seeded study session."
      }
    });
  }

  for (const tx of financeTransactions) {
    await prisma.financeTransaction.create({
      data: {
        userId: user.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        date: toDate(tx.date),
        notes: tx.notes
      }
    });
  }

  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: "Emergency fund",
      targetAmount: 10000,
      currentAmount: 5400,
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      notes: "Three-month baseline goal."
    }
  });

  await prisma.weeklyReview.create({
    data: {
      userId: user.id,
      weekStart: new Date(),
      improved: "Sleep consistency and training logs.",
      avoided: "Budget review was delayed until Friday.",
      helpfulHabits: "Morning sunlight walk and protein target.",
      changesNextWeek: "Plan workouts before the workday starts.",
      mainFocusNextWeek: "Protect sleep and finish the SQL portfolio case study.",
      spendingReview: "Dining and subscriptions are the categories to watch."
    }
  });

  for (const insight of insights) {
    await prisma.insight.create({
      data: {
        userId: user.id,
        category: insight.category,
        title: insight.title,
        body: insight.body,
        confidence: insight.confidence
      }
    });
  }

  const pressId = exerciseIdByName.get("Machine Chest Press");
  const rowId = exerciseIdByName.get("Chest-Supported Row");
  const curlId = exerciseIdByName.get("Cable Curl");

  for (const log of workoutLogs) {
    const created = await prisma.workoutLog.create({
      data: {
        userId: user.id,
        workoutPlanId: workoutPlan.id,
        date: toDate(log.date),
        title: log.title,
        durationMinutes: log.durationMinutes,
        sessionDifficulty: log.sessionDifficulty,
        performanceTrend: log.performanceTrend,
        notes: log.notes
      }
    });

    const setInputs = [
      { exerciseId: pressId, reps: 10, weight: 165, rir: 2 },
      { exerciseId: rowId, reps: 12, weight: 120, rir: 2 },
      { exerciseId: curlId, reps: 14, weight: 45, rir: 1 }
    ].filter((item): item is { exerciseId: string; reps: number; weight: number; rir: number } => Boolean(item.exerciseId));

    for (const [index, set] of setInputs.entries()) {
      await prisma.workoutSet.create({
        data: {
          workoutLogId: created.id,
          exerciseId: set.exerciseId,
          setNumber: index + 1,
          reps: set.reps,
          weight: set.weight,
          rir: set.rir,
          restSeconds: 120,
          volumeLoad: set.reps * set.weight,
          estimatedOneRepMax: set.weight * (1 + set.reps / 30)
        }
      });
    }

    await prisma.postWorkoutFeedback.create({
      data: {
        workoutLogId: created.id,
        pumpScore: 7,
        targetLimited: true,
        jointPain: false,
        sessionDifficulty: log.sessionDifficulty,
        soreness: 4,
        performanceTrend: log.performanceTrend,
        recoveryQuality: 7,
        notes: "Seeded feedback: good stimulus and manageable fatigue."
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
