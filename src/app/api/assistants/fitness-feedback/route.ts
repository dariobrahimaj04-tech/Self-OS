import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";

type FitnessFeedbackBody = {
  date?: string;
  titleText?: string;
  recovery?: "good" | "okay" | "poor";
  sorenessAreas?: string[];
  sorenessLevel?: "low" | "moderate" | "high";
  pumpQuality?: number;
  targetMuscleFeel?: number;
  jointPain?: "none" | "mild" | "moderate" | "severe";
  affectedAreas?: string[];
  sessionDifficulty?: number;
  performance?: "better" | "same" | "worse";
  notes?: string;
};

const sorenessScore = { low: 3, moderate: 6, high: 8 };
const recoveryScore = { good: 8, okay: 6, poor: 3 };
const performanceTrend = { better: "improved", same: "stable", worse: "dropped" } as const;

function score(value: unknown, fallback: number, max = 10) {
  const next = Number(value ?? fallback);
  return Math.max(1, Math.min(max, Math.round(Number.isFinite(next) ? next : fallback)));
}

export async function POST(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as FitnessFeedbackBody | null;
  if (!body) return NextResponse.json({ error: "Fitness feedback payload is required." }, { status: 400 });

  const jointPain = body.jointPain ?? "none";
  const sorenessLevel = body.sorenessLevel ?? "moderate";
  const recovery = body.recovery ?? "okay";
  const performance = body.performance ?? "same";
  const notes = [
    body.notes,
    body.sorenessAreas?.length ? `Soreness areas: ${body.sorenessAreas.join(", ")}` : undefined,
    body.affectedAreas?.length ? `Affected areas: ${body.affectedAreas.join(", ")}` : undefined,
    jointPain !== "none" ? "Joint pain was reported. Do not push through pain; review substitutions." : undefined
  ].filter(Boolean).join("\n");

  const log = await getPrisma().workoutLog.create({
    data: {
      userId: user.id,
      date: new Date(`${body.date ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
      title: body.titleText?.trim() || "Assistant fitness feedback",
      sessionDifficulty: score(body.sessionDifficulty, 5),
      performanceTrend: performanceTrend[performance],
      notes,
      feedback: {
        create: {
          pumpScore: score(body.pumpQuality, 3, 5),
          targetLimited: score(body.targetMuscleFeel, 3, 5) >= 3,
          jointPain: jointPain !== "none",
          jointPainNotes: jointPain !== "none" ? `${jointPain} pain reported. ${notes}` : undefined,
          sessionDifficulty: score(body.sessionDifficulty, 5),
          soreness: sorenessScore[sorenessLevel],
          performanceTrend: performanceTrend[performance],
          recoveryQuality: recoveryScore[recovery],
          notes
        }
      }
    },
    include: { feedback: true }
  });

  return NextResponse.json({ data: log }, { status: 201 });
}
