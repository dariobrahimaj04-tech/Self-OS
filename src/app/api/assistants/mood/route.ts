import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";

type MoodAssistantBody = {
  date?: string;
  mood?: number;
  energy?: number;
  stress?: number;
  sleepQuality?: number;
  socialConnection?: number;
  anxietyLevel?: number;
  productivity?: number;
  notes?: string;
  themes?: string[];
};

function score(value: unknown, fallback: number) {
  const next = Number(value ?? fallback);
  return Math.max(1, Math.min(10, Math.round(Number.isFinite(next) ? next : fallback)));
}

export async function POST(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as MoodAssistantBody | null;
  if (!body) return NextResponse.json({ error: "Mood assistant payload is required." }, { status: 400 });

  const notes = [
    body.notes,
    body.themes?.length ? `Themes: ${body.themes.join(", ")}` : undefined
  ].filter(Boolean).join("\n");

  const data = await getPrisma().moodLog.create({
    data: {
      userId: user.id,
      date: new Date(`${body.date ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
      mood: score(body.mood, 6),
      energy: score(body.energy, 5),
      stress: score(body.stress, 5),
      sleepQuality: score(body.sleepQuality, 6),
      socialConnection: score(body.socialConnection, 5),
      anxietyLevel: score(body.anxietyLevel, 5),
      productivity: score(body.productivity, 6),
      notes
    }
  });

  return NextResponse.json({ data }, { status: 201 });
}
