import type { AssistantConfidence, ModuleAssistantPreview } from "@/components/module-assistant";
import type { GoalView, HabitView } from "@/lib/types";

type HabitAssistantStatus = "completed" | "missed" | "ignore";
type GoalAssistantStatus = "progressed" | "completed" | "blocked" | "delayed";
type FitnessRecovery = "good" | "okay" | "poor";
type FitnessSoreness = "low" | "moderate" | "high";
type FitnessPain = "none" | "mild" | "moderate" | "severe";
type FitnessPerformance = "better" | "same" | "worse";

export type MoodAssistantPreview = ModuleAssistantPreview & {
  id: string;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleepQuality: number;
  socialConnection: number;
  anxietyLevel: number;
  productivity: number;
  themes: string[];
  notes: string;
  rawRequest: string;
};

export type HabitAssistantPreview = ModuleAssistantPreview & {
  id: string;
  date: string;
  statuses: Array<{
    habitId: string;
    habitName: string;
    status: HabitAssistantStatus;
    confidence: AssistantConfidence;
  }>;
  unmatched: string[];
  notes: string;
  rawRequest: string;
};

export type GoalAssistantPreview = ModuleAssistantPreview & {
  id: string;
  date: string;
  goalId: string;
  candidateGoals: Array<{ id: string; title: string; score: number }>;
  progressUpdate: string;
  timeSpentMinutes: number;
  status: GoalAssistantStatus;
  progressDelta: number;
  nextStep: string;
  notes: string;
  rawRequest: string;
};

export type FitnessFeedbackAssistantPreview = ModuleAssistantPreview & {
  id: string;
  date: string;
  titleText: string;
  recovery: FitnessRecovery;
  sorenessAreas: string[];
  sorenessLevel: FitnessSoreness;
  pumpQuality: number;
  targetMuscleFeel: number;
  jointPain: FitnessPain;
  affectedAreas: string[];
  sessionDifficulty: number;
  performance: FitnessPerformance;
  notes: string;
  rawRequest: string;
};

const stopWords = new Set([
  "a",
  "an",
  "and",
  "but",
  "for",
  "i",
  "my",
  "of",
  "on",
  "the",
  "to",
  "today",
  "was",
  "with"
]);

const moodThemes: Array<[RegExp, string]> = [
  [/\bstress|overwhelm|pressure\b/i, "stress"],
  [/\bproductive|focused|focus|got things done\b/i, "productivity"],
  [/\btired|fatigue|drained|exhausted\b/i, "low energy"],
  [/\banxious|anxiety|worried|nervous\b/i, "anxiety"],
  [/\bcalm|steady|peaceful\b/i, "calm"],
  [/\bproud|confident|good|great\b/i, "positive"],
  [/\bunmotivated|avoid|avoided|stuck\b/i, "motivation"]
];

const musclePatterns: Array<[RegExp, string]> = [
  [/\bshoulder|delt\b/i, "shoulders"],
  [/\bchest|pec\b/i, "chest"],
  [/\belbow|tricep|bicep|arm\b/i, "elbows/arms"],
  [/\bknee|quad|leg\b/i, "knees/legs"],
  [/\blower back|back\b/i, "back"],
  [/\bhip|glute\b/i, "hips/glutes"],
  [/\bhamstring\b/i, "hamstrings"]
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function confidenceFromScore(score: number): AssistantConfidence {
  if (score >= 0.75) return "high";
  if (score >= 0.35) return "medium";
  return "low";
}

function textMatchesName(text: string, name: string) {
  const normalizedText = normalize(text);
  const normalizedName = normalize(name);
  if (!normalizedName) return 0;
  if (normalizedText.includes(normalizedName)) return 1;
  const nameTokens = tokens(name);
  if (!nameTokens.length) return 0;
  const matched = nameTokens.filter((token) => normalizedText.includes(token)).length;
  return matched / nameTokens.length;
}

function extractTimeSpent(text: string) {
  const hours = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/gi)].reduce((total, match) => total + Number(match[1]) * 60, 0);
  const minutes = [...text.matchAll(/(\d+)\s*(?:minutes?|mins?|m)\b/gi)].reduce((total, match) => total + Number(match[1]), 0);
  return Math.round(hours + minutes);
}

function extractAreas(text: string) {
  return Array.from(new Set(musclePatterns.filter(([pattern]) => pattern.test(text)).map(([, area]) => area)));
}

export function parseMoodAssistantRequest(request: string, now = new Date()): MoodAssistantPreview {
  const rawRequest = request.trim();
  const normalized = normalize(rawRequest);
  const positive = /\bgood|great|better|calm|focused|proud|productive|happy|steady\b/.test(normalized);
  const negative = /\bbad|rough|tired|unmotivated|stressed|anxious|overwhelmed|sad\b/.test(normalized);
  const stressed = /\bstress|stressed|overwhelmed|pressure\b/.test(normalized);
  const anxious = /\banxious|anxiety|worried|nervous\b/.test(normalized);
  const tired = /\btired|drained|exhausted|low energy|fatigue\b/.test(normalized);
  const productive = /\bproductive|focused|focus|got things done|finished\b/.test(normalized);
  const calm = /\bcalm|peaceful|steady\b/.test(normalized);
  const themes = moodThemes.filter(([pattern]) => pattern.test(rawRequest)).map(([, theme]) => theme);
  const confidence: AssistantConfidence = rawRequest.length < 12 ? "low" : themes.length >= 2 ? "medium" : "low";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "Mood log preview",
    summary: "Review the estimated scores before saving. SelfOS is not diagnosing anything here.",
    confidence,
    warnings: [
      "Mood parsing is a practical estimate, not a mental health diagnosis.",
      ...(confidence === "low" ? ["The entry was vague, so the scores are conservative editable assumptions."] : [])
    ],
    date: now.toISOString().slice(0, 10),
    mood: clamp(positive ? 8 : negative ? 4 : 6, 1, 10),
    energy: clamp(tired ? 3 : productive ? 7 : positive ? 7 : 5, 1, 10),
    stress: clamp(stressed ? 8 : calm ? 3 : anxious ? 7 : 5, 1, 10),
    sleepQuality: clamp(tired ? 4 : 6, 1, 10),
    socialConnection: 5,
    anxietyLevel: clamp(anxious ? 8 : calm ? 3 : stressed ? 6 : 5, 1, 10),
    productivity: clamp(productive ? 8 : /\bunmotivated|avoid|stuck\b/.test(normalized) ? 3 : 6, 1, 10),
    themes: Array.from(new Set(themes)),
    notes: `Mood Assistant estimate from: "${rawRequest || "No reflection entered."}"`,
    rawRequest
  };
}

export function parseHabitAssistantRequest(request: string, habits: HabitView[], now = new Date()): HabitAssistantPreview {
  const rawRequest = request.trim();
  const missedText = rawRequest.match(/(?:missed|forgot|didn'?t do|did not do)\s+(.+)$/i)?.[1] ?? "";
  const completedText = rawRequest.replace(/(?:but\s+)?(?:missed|forgot|didn'?t do|did not do)\s+.+$/i, "");
  const didEverythingElse = /everything else/i.test(rawRequest);
  const statuses = habits.map((habit) => {
    const missedScore = textMatchesName(missedText, habit.name);
    const completedScore = Math.max(textMatchesName(completedText, habit.name), didEverythingElse && missedScore < 0.5 ? 0.75 : 0);
    const status: HabitAssistantStatus = missedScore >= 0.5 ? "missed" : completedScore >= 0.5 ? "completed" : "ignore";
    return {
      habitId: habit.id,
      habitName: habit.name,
      status,
      confidence: confidenceFromScore(Math.max(missedScore, completedScore))
    };
  });
  const matched = statuses.filter((item) => item.status !== "ignore");
  const confidence: AssistantConfidence = matched.length ? (matched.some((item) => item.confidence === "low") ? "medium" : "high") : "low";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "Habit update preview",
    summary: "Confirm which habits should be marked complete or missed for today.",
    confidence,
    warnings: [
      ...(habits.length ? [] : ["No habits exist yet. Create habits first, then the assistant can mark them."]),
      ...(matched.length ? [] : ["No existing habits were confidently matched. Choose statuses manually before applying."])
    ],
    date: now.toISOString().slice(0, 10),
    statuses,
    unmatched: matched.length ? [] : [rawRequest].filter(Boolean),
    notes: `Habits Assistant from: "${rawRequest || "No habit update entered."}"`,
    rawRequest
  };
}

export function parseGoalAssistantRequest(request: string, goals: GoalView[], now = new Date()): GoalAssistantPreview {
  const rawRequest = request.trim();
  const timeSpentMinutes = extractTimeSpent(rawRequest);
  const candidateGoals = goals
    .map((goal) => ({
      id: goal.id,
      title: goal.title,
      score: Math.max(textMatchesName(rawRequest, goal.title), textMatchesName(rawRequest, goal.category))
    }))
    .filter((item) => item.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const completed = /\bfinished|completed|done|shipped\b/i.test(rawRequest);
  const blocked = /\bblocked|stuck|couldn'?t|cannot|didn'?t finish|did not finish\b/i.test(rawRequest);
  const delayed = /\bdelayed|postponed|behind\b/i.test(rawRequest);
  const status: GoalAssistantStatus = completed ? "completed" : blocked ? "blocked" : delayed ? "delayed" : "progressed";
  const confidence = candidateGoals[0] ? confidenceFromScore(candidateGoals[0].score) : "low";
  const progressDelta = completed ? 20 : blocked || delayed ? 0 : timeSpentMinutes >= 90 ? 10 : 5;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "Goal progress preview",
    summary: "Review the matched goal and progress note before saving.",
    confidence,
    warnings: [
      ...(candidateGoals.length ? [] : ["No goal was confidently matched. This can be saved as a standalone journal progress note."]),
      "Progress changes are editable and intentionally conservative."
    ],
    date: now.toISOString().slice(0, 10),
    goalId: candidateGoals[0]?.id ?? "",
    candidateGoals,
    progressUpdate: rawRequest || "Progress update",
    timeSpentMinutes,
    status,
    progressDelta,
    nextStep: "",
    notes: `Goals Assistant from: "${rawRequest || "No goal update entered."}"`,
    rawRequest
  };
}

export function parseFitnessFeedbackAssistantRequest(request: string, now = new Date()): FitnessFeedbackAssistantPreview {
  const rawRequest = request.trim();
  const normalized = normalize(rawRequest);
  const great = /\bgreat|excellent|strong|good\b/.test(normalized);
  const hard = /\bhard|brutal|difficult|tough\b/.test(normalized);
  const tired = /\btired|fatigued|drained|worn\b/.test(normalized);
  const sore = /\bsore|soreness|achy\b/.test(normalized);
  const verySore = /\bvery sore|super sore|really sore|high soreness\b/.test(normalized);
  const pump = /\bpump|pumped\b/.test(normalized);
  const pain = /\bpain|hurt|bother|weird|twinge\b/.test(normalized);
  const severe = /\bsevere|sharp|bad pain\b/.test(normalized);
  const moderate = /\bmoderate|pretty painful|weird\b/.test(normalized);
  const better = /\bbetter|improved|stronger|progress\b/.test(normalized);
  const worse = /\bworse|dropped|weaker|regressed\b/.test(normalized);
  const areas = extractAreas(rawRequest);
  const jointPain: FitnessPain = pain ? severe ? "severe" : moderate ? "moderate" : "mild" : "none";
  const sorenessLevel: FitnessSoreness = verySore ? "high" : sore || tired ? "moderate" : "low";
  const recovery: FitnessRecovery = tired || verySore || jointPain === "moderate" || jointPain === "severe" ? "poor" : great ? "good" : "okay";
  const confidence: AssistantConfidence = rawRequest.length < 12 ? "low" : areas.length || pump || pain || better || worse || hard ? "medium" : "low";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "Fitness feedback preview",
    summary: "Review recovery, soreness, pump, pain, and performance before saving feedback.",
    confidence,
    warnings: [
      ...(jointPain === "none" ? [] : ["Joint pain was mentioned. Do not push through pain; review the movement and consider substitutions."]),
      ...(recovery === "poor" ? ["Poor recovery should not trigger added volume."] : [])
    ],
    date: now.toISOString().slice(0, 10),
    titleText: "Assistant fitness feedback",
    recovery,
    sorenessAreas: areas,
    sorenessLevel,
    pumpQuality: clamp(pump ? great ? 5 : 4 : 3, 1, 5),
    targetMuscleFeel: clamp(pump ? 4 : 3, 1, 5),
    jointPain,
    affectedAreas: areas,
    sessionDifficulty: clamp(hard ? 8 : great ? 6 : tired ? 7 : 5, 1, 10),
    performance: better ? "better" : worse ? "worse" : "same",
    notes: `Fitness Feedback Assistant from: "${rawRequest || "No workout feedback entered."}"`,
    rawRequest
  };
}
