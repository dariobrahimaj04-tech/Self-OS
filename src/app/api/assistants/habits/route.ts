import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";

type HabitAssistantBody = {
  date?: string;
  completedHabitIds?: string[];
  missedHabitIds?: string[];
  notes?: string;
};

function dateFromInput(value?: string) {
  return new Date(`${value ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export async function POST(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as HabitAssistantBody | null;
  const completedHabitIds = Array.from(new Set(body?.completedHabitIds ?? []));
  const missedHabitIds = Array.from(new Set(body?.missedHabitIds ?? [])).filter((id) => !completedHabitIds.includes(id));
  const habitIds = [...completedHabitIds, ...missedHabitIds];
  if (!habitIds.length) return NextResponse.json({ error: "At least one habit status is required." }, { status: 400 });

  const prisma = getPrisma();
  const habits = await prisma.habit.findMany({ where: { userId: user.id, id: { in: habitIds }, archived: false } });
  if (habits.length !== habitIds.length) {
    return NextResponse.json({ error: "One or more habits were not found for this user." }, { status: 403 });
  }

  const date = dateFromInput(body?.date);
  const results = await Promise.all([
    ...completedHabitIds.map((habitId) =>
      prisma.habitLog.upsert({
        where: { habitId_date: { habitId, date } },
        update: { completed: true, skipReason: null, notes: body?.notes },
        create: { userId: user.id, habitId, date, completed: true, notes: body?.notes }
      })
    ),
    ...missedHabitIds.map((habitId) =>
      prisma.habitLog.upsert({
        where: { habitId_date: { habitId, date } },
        update: { completed: false, skipReason: "Assistant marked missed", notes: body?.notes },
        create: { userId: user.id, habitId, date, completed: false, skipReason: "Assistant marked missed", notes: body?.notes }
      })
    )
  ]);

  return NextResponse.json({ data: results }, { status: 201 });
}
