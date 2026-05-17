-- AlterTable
ALTER TABLE "FitnessProfile"
ADD COLUMN "monthsOrYearsTraining" TEXT,
ADD COLUMN "preferredExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "favoriteExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "blockedExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "painfulExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "allowAdvancedExercises" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowMyoReps" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowLengthenedPartials" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowBarbellCompounds" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowHighSpinalLoading" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "progressionStyle" TEXT NOT NULL DEFAULT 'double progression';

-- AlterTable
ALTER TABLE "Exercise"
ADD COLUMN "experienceTier" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN "technicalDifficulty" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "rangeOfMotionRating" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN "spinalLoading" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN "systemicFatigue" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN "jointStress" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN "suggestedRestRange" TEXT NOT NULL DEFAULT '60-90s',
ADD COLUMN "advancedMethodAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "alternatives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "FitnessProgrammingSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredSplit" TEXT NOT NULL DEFAULT 'upper/lower',
    "trainingDays" INTEGER NOT NULL DEFAULT 4,
    "mesocycleLength" INTEGER NOT NULL DEFAULT 4,
    "defaultRirProgression" INTEGER[] NOT NULL DEFAULT ARRAY[3, 2, 2, 1]::INTEGER[],
    "defaultMinSets" INTEGER NOT NULL DEFAULT 2,
    "defaultMaxSets" INTEGER NOT NULL DEFAULT 4,
    "preferredExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "favoriteExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "blockedExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "painfulExercises" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "allowAdvancedExercises" BOOLEAN NOT NULL DEFAULT false,
    "allowMyoReps" BOOLEAN NOT NULL DEFAULT false,
    "allowLengthenedPartials" BOOLEAN NOT NULL DEFAULT false,
    "allowBarbellCompounds" BOOLEAN NOT NULL DEFAULT true,
    "allowHighSpinalLoading" BOOLEAN NOT NULL DEFAULT false,
    "weakMusclePriorities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "useAbVariation" BOOLEAN NOT NULL DEFAULT true,
    "preferredProgressionStyle" TEXT NOT NULL DEFAULT 'double progression',
    "deloadTriggerSensitivity" TEXT NOT NULL DEFAULT 'moderate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessProgrammingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitnessProgrammingSettings_userId_key" ON "FitnessProgrammingSettings"("userId");

-- AddForeignKey
ALTER TABLE "FitnessProgrammingSettings" ADD CONSTRAINT "FitnessProgrammingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
