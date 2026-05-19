"use client";

import { Dumbbell, Save, Settings2, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { FitnessPlanner } from "@/components/fitness-planner";
import { Card, EmptyState, SectionTitle, StatCard } from "@/components/ui";
import { curatedExerciseLibrary, defaultFitnessSettings, generateWorkoutPlan } from "@/lib/fitness-programming";
import { ensureInitialVersion } from "@/lib/fitness-plan-utils";
import type { FitnessProgrammingSettings, FitnessProfileInput, GeneratedWorkoutPlan, WorkoutLogView } from "@/lib/types";

const equipmentOptions = ["machines", "cables", "dumbbells", "barbell", "smith machine", "bodyweight", "ez bar"];
const muscleOptions = ["Chest", "Back", "Shoulders", "Rear Delts", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves", "Abs", "Forearms"];

const defaultProfile: FitnessProfileInput = {
  age: 30,
  heightCm: 175,
  weightKg: 75,
  trainingExperience: "intermediate",
  monthsOrYearsTraining: "",
  primaryGoal: "hypertrophy",
  secondaryGoal: "",
  daysAvailablePerWeek: 4,
  preferredWorkoutDuration: 70,
  availableEquipment: ["machines", "cables", "dumbbells"],
  weakMuscleGroups: [],
  injuriesOrLimitations: "",
  sleepAverage: 7,
  stressLevel: 5,
  recoveryQuality: 7,
  preferredSplit: "upper/lower",
  strengthNumbers: {},
  preferredExercises: [],
  favoriteExercises: [],
  blockedExercises: [],
  painfulExercises: [],
  allowAdvancedExercises: false,
  allowMyoReps: false,
  allowLengthenedPartials: false,
  allowBarbellCompounds: true,
  allowHighSpinalLoadingExercises: false,
  preferredProgressionStyle: "double progression"
};

function toCsv(values?: string[]) {
  return values?.join(", ") ?? "";
}

function fromCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function profileComplete(profile: FitnessProfileInput) {
  return Boolean(
    profile.trainingExperience &&
      profile.primaryGoal &&
      profile.daysAvailablePerWeek >= 2 &&
      profile.preferredSplit &&
      profile.preferredWorkoutDuration >= 30 &&
      profile.availableEquipment.length &&
      profile.sleepAverage > 0 &&
      profile.stressLevel >= 1 &&
      profile.recoveryQuality >= 1
  );
}

function recoveryLabel(score: number) {
  if (score >= 8) return "High Recovery";
  if (score >= 6) return "Moderate Recovery";
  return "Recovery Limited";
}

function badgeClass(tone: "blue" | "green" | "amber" = "blue") {
  const tones = {
    blue: "border-mineral/30 bg-mineral/10 text-mineral",
    green: "border-evergreen/30 bg-evergreen/10 text-evergreen",
    amber: "border-gold/30 bg-gold/10 text-gold"
  };
  return `rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`;
}

export function FitnessProgrammingWorkspace({
  initialProfile,
  initialSettings,
  initialPlan,
  initialWorkoutLogs = []
}: {
  initialProfile: FitnessProfileInput | null;
  initialSettings: FitnessProgrammingSettings | null;
  initialPlan?: GeneratedWorkoutPlan | null;
  initialWorkoutLogs?: WorkoutLogView[];
}) {
  const [profile, setProfile] = useState<FitnessProfileInput>(initialProfile ?? defaultProfile);
  const [settings, setSettings] = useState<FitnessProgrammingSettings>({
    ...defaultFitnessSettings,
    ...(initialSettings ?? {}),
    trainingDays: initialSettings?.trainingDays ?? initialProfile?.daysAvailablePerWeek ?? defaultFitnessSettings.trainingDays,
    preferredSplit: initialSettings?.preferredSplit ?? initialProfile?.preferredSplit ?? defaultFitnessSettings.preferredSplit
  });
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);
  const [generated, setGenerated] = useState(() =>
    initialPlan ? ensureInitialVersion(initialPlan) : initialProfile ? ensureInitialVersion(generateWorkoutPlan(initialProfile, undefined, initialSettings ?? undefined)) : null
  );

  const complete = profileComplete(profile);
  const exerciseNames = useMemo(() => curatedExerciseLibrary.map((exercise) => exercise.name).sort(), []);

  function update<K extends keyof FitnessProfileInput>(key: K, value: FitnessProfileInput[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileStatus("Saving profile...");
    const response = await fetch("/api/fitness/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    setProfileStatus(response.ok ? "Fitness profile saved." : "Could not save profile. Check your database/session.");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsStatus("Saving settings...");
    const response = await fetch("/api/fitness/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    setSettingsStatus(response.ok ? "Fitness programming settings saved." : "Could not save settings. Check your database/session.");
  }

  function generateProgram() {
    const nextSettings = { ...settings, trainingDays: profile.daysAvailablePerWeek, preferredSplit: profile.preferredSplit };
    setSettings(nextSettings);
    setGenerated(ensureInitialVersion(generateWorkoutPlan(profile, undefined, nextSettings)));
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Experience" value={profile.trainingExperience} detail={profile.monthsOrYearsTraining || "Training age not set"} tone="green" />
        <StatCard label="Training Days" value={profile.daysAvailablePerWeek} detail={profile.preferredSplit} tone="blue" />
        <StatCard label="Recovery" value={`${profile.recoveryQuality}/10`} detail={`${profile.sleepAverage}h sleep avg`} tone={profile.recoveryQuality >= 7 ? "green" : "amber"} />
        <StatCard label="Goal" value={profile.primaryGoal} detail={`${profile.preferredWorkoutDuration} min sessions`} tone="amber" />
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <SectionTitle title={initialProfile ? "Edit Fitness Profile" : "Create Fitness Profile"} subtitle="RP-inspired evidence-based hypertrophy programming starts with your real constraints." />
          <div className="flex flex-wrap gap-2">
            <span className={badgeClass("green")}>{profile.trainingExperience}</span>
            <span className={badgeClass("blue")}>{profile.daysAvailablePerWeek} Days</span>
            <span className={badgeClass("blue")}>{profile.primaryGoal}</span>
            <span className={badgeClass(profile.recoveryQuality >= 7 ? "green" : "amber")}>{recoveryLabel(profile.recoveryQuality)}</span>
          </div>
        </div>

        <form onSubmit={saveProfile} className="grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Experience Level</span>
            <select className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" value={profile.trainingExperience} onChange={(event) => update("trainingExperience", event.target.value as FitnessProfileInput["trainingExperience"])}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Months / Years Training</span>
            <input className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" value={profile.monthsOrYearsTraining ?? ""} onChange={(event) => update("monthsOrYearsTraining", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Primary Goal</span>
            <select className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" value={profile.primaryGoal} onChange={(event) => update("primaryGoal", event.target.value as FitnessProfileInput["primaryGoal"])}>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="strength">Strength</option>
              <option value="recomposition">Recomposition</option>
              <option value="general fitness">General fitness</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Days Available</span>
            <input className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" min={2} max={6} type="number" value={profile.daysAvailablePerWeek} onChange={(event) => update("daysAvailablePerWeek", Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Preferred Split</span>
            <select className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" value={profile.preferredSplit} onChange={(event) => update("preferredSplit", event.target.value as FitnessProfileInput["preferredSplit"])}>
              <option value="full body">Full body</option>
              <option value="upper/lower">Upper/lower</option>
              <option value="push/pull/legs">Push/pull/legs</option>
              <option value="hybrid">Hybrid</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Workout Length</span>
            <input className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" min={30} max={150} type="number" value={profile.preferredWorkoutDuration} onChange={(event) => update("preferredWorkoutDuration", Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Sleep Average</span>
            <input className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" step="0.1" type="number" value={profile.sleepAverage} onChange={(event) => update("sleepAverage", Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Stress Level</span>
            <input className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" min={1} max={10} type="number" value={profile.stressLevel} onChange={(event) => update("stressLevel", Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Recovery Quality</span>
            <input className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" min={1} max={10} type="number" value={profile.recoveryQuality} onChange={(event) => update("recoveryQuality", Number(event.target.value))} />
          </label>
          <label className="block lg:col-span-3">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Available Equipment</span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {equipmentOptions.map((item) => (
                <label key={item} className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3 text-sm">
                  <input
                    className="accent-mineral"
                    type="checkbox"
                    checked={profile.availableEquipment.includes(item)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...profile.availableEquipment, item]
                        : profile.availableEquipment.filter((value) => value !== item);
                      update("availableEquipment", next);
                    }}
                  />
                  {item}
                </label>
              ))}
            </div>
          </label>
          <TextArea label="Weak Muscle Groups" value={toCsv(profile.weakMuscleGroups)} onChange={(value) => update("weakMuscleGroups", fromCsv(value))} helper={`Examples: ${muscleOptions.slice(0, 5).join(", ")}`} />
          <TextArea label="Preferred Exercises" value={toCsv(profile.preferredExercises)} onChange={(value) => update("preferredExercises", fromCsv(value))} helper="Included if they fit recovery and fatigue rules." names={exerciseNames} />
          <TextArea label="Favorite Exercises" value={toCsv(profile.favoriteExercises)} onChange={(value) => update("favoriteExercises", fromCsv(value))} helper="Small scoring boost when appropriate." names={exerciseNames} />
          <TextArea label="Blocked Exercises" value={toCsv(profile.blockedExercises)} onChange={(value) => update("blockedExercises", fromCsv(value))} helper="Never selected." names={exerciseNames} />
          <TextArea label="Painful Exercises" value={toCsv(profile.painfulExercises)} onChange={(value) => update("painfulExercises", fromCsv(value))} helper="Avoided and explained." names={exerciseNames} />
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Injuries or Limitations</span>
            <textarea className="focus-ring min-h-28 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink" value={profile.injuriesOrLimitations ?? ""} onChange={(event) => update("injuriesOrLimitations", event.target.value)} />
          </label>
          <div className="grid gap-2 lg:col-span-3 sm:grid-cols-2 xl:grid-cols-5">
            <Toggle label="Advanced exercises" checked={Boolean(profile.allowAdvancedExercises)} onChange={(value) => update("allowAdvancedExercises", value)} />
            <Toggle label="Myo-reps" checked={Boolean(profile.allowMyoReps)} onChange={(value) => update("allowMyoReps", value)} />
            <Toggle label="Lengthened partials" checked={Boolean(profile.allowLengthenedPartials)} onChange={(value) => update("allowLengthenedPartials", value)} />
            <Toggle label="Barbell compounds" checked={profile.allowBarbellCompounds !== false} onChange={(value) => update("allowBarbellCompounds", value)} />
            <Toggle label="High spinal loading" checked={Boolean(profile.allowHighSpinalLoadingExercises)} onChange={(value) => update("allowHighSpinalLoadingExercises", value)} />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-3 sm:flex-row sm:items-center">
            <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90 sm:w-auto" type="submit">
              <Save size={17} />
              Save Profile
            </button>
            {complete ? (
              <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-400/40 transition-colors hover:bg-blue-500 sm:w-auto" type="button" onClick={generateProgram}>
                <Sparkles size={17} />
                Generate Program
              </button>
            ) : null}
            {profileStatus ? <p className="text-sm text-muted">{profileStatus}</p> : null}
          </div>
        </form>
      </Card>

      <FitnessSettingsForm settings={settings} setSettings={setSettings} onSubmit={saveSettings} status={settingsStatus} />

      {generated ? (
        <FitnessPlanner
          key={`${generated.name}-${generated.days.length}-${generated.volume.map((item) => `${item.muscle}:${item.plannedSets}`).join("|")}`}
          plan={generated}
          profile={profile}
          settings={settings}
          onSettingsChange={setSettings}
          onProfileChange={setProfile}
          workoutLogs={initialWorkoutLogs}
        />
      ) : (
        <EmptyState title="Create a complete fitness profile" body="The Generate Program button appears after required profile fields are complete." />
      )}
    </div>
  );
}

function TextArea({
  label,
  value,
  helper,
  onChange
}: {
  label: string;
  value: string;
  helper?: string;
  names?: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{label}</span>
      <textarea className="focus-ring min-h-24 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink" value={value} onChange={(event) => onChange(event.target.value)} />
      {helper ? <span className="mt-1 block text-xs text-muted">{helper}</span> : null}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface p-3 text-sm">
      <input className="accent-mineral" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function FitnessSettingsForm({
  settings,
  setSettings,
  onSubmit,
  status,
  compact = false
}: {
  settings: FitnessProgrammingSettings;
  setSettings: (settings: FitnessProgrammingSettings) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  status?: string | null;
  compact?: boolean;
}) {
  function update<K extends keyof FitnessProgrammingSettings>(key: K, value: FitnessProgrammingSettings[K]) {
    setSettings({ ...settings, [key]: value });
  }

  return (
    <Card>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white ring-1 ring-blue-400/40">
          <Settings2 size={18} />
        </span>
        <SectionTitle title="Fitness Programming Settings" subtitle="User-controlled defaults for generated programs. These settings are private to your account." />
      </div>
      <form onSubmit={onSubmit} className={`grid gap-4 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Preferred Split</span>
          <select className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" value={settings.preferredSplit} onChange={(event) => update("preferredSplit", event.target.value as FitnessProgrammingSettings["preferredSplit"])}>
            <option value="full body">Full body</option>
            <option value="upper/lower">Upper/lower</option>
            <option value="push/pull/legs">Push/pull/legs</option>
            <option value="hybrid">Hybrid</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <NumberField label="Training Days" value={settings.trainingDays} min={2} max={6} onChange={(value) => update("trainingDays", value)} />
        <NumberField label="Mesocycle Length" value={settings.mesocycleLength} min={3} max={8} onChange={(value) => update("mesocycleLength", value)} />
        <NumberField label="Default Min Sets" value={settings.defaultMinSets} min={1} max={4} onChange={(value) => update("defaultMinSets", value)} />
        <NumberField label="Default Max Sets" value={settings.defaultMaxSets} min={2} max={6} onChange={(value) => update("defaultMaxSets", value)} />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Progression Style</span>
          <select className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" value={settings.preferredProgressionStyle} onChange={(event) => update("preferredProgressionStyle", event.target.value as FitnessProgrammingSettings["preferredProgressionStyle"])}>
            <option value="add reps first">Add reps first</option>
            <option value="add load first">Add load first</option>
            <option value="double progression">Double progression</option>
          </select>
        </label>
        <TextArea label="Default RIR Progression" value={settings.defaultRirProgression.join(", ")} onChange={(value) => update("defaultRirProgression", fromCsv(value).map(Number).filter(Number.isFinite))} helper="Example: 3, 2, 2, 1" />
        <TextArea label="Preferred Exercises" value={toCsv(settings.preferredExercises)} onChange={(value) => update("preferredExercises", fromCsv(value))} />
        <TextArea label="Blocked Exercises" value={toCsv(settings.blockedExercises)} onChange={(value) => update("blockedExercises", fromCsv(value))} />
        <TextArea label="Painful Exercises" value={toCsv(settings.painfulExercises)} onChange={(value) => update("painfulExercises", fromCsv(value))} />
        <TextArea label="Weak Muscle Priorities" value={toCsv(settings.weakMusclePriorities)} onChange={(value) => update("weakMusclePriorities", fromCsv(value))} />
        <div className="grid gap-2 lg:col-span-3 sm:grid-cols-2 xl:grid-cols-5">
          <Toggle label="A/B variation" checked={settings.useAbVariation} onChange={(value) => update("useAbVariation", value)} />
          <Toggle label="Advanced exercises" checked={settings.allowAdvancedExercises} onChange={(value) => update("allowAdvancedExercises", value)} />
          <Toggle label="Myo-reps" checked={settings.allowMyoReps} onChange={(value) => update("allowMyoReps", value)} />
          <Toggle label="Barbell compounds" checked={settings.allowBarbellCompounds} onChange={(value) => update("allowBarbellCompounds", value)} />
          <Toggle label="High spinal loading" checked={settings.allowHighSpinalLoading} onChange={(value) => update("allowHighSpinalLoading", value)} />
        </div>
        <div className="flex flex-col gap-3 lg:col-span-3 sm:flex-row sm:items-center">
          <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-mineral/10 sm:w-auto" type="submit">
            <Dumbbell size={17} />
            Save Fitness Settings
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>
    </Card>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{label}</span>
      <input className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink" min={min} max={max} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
