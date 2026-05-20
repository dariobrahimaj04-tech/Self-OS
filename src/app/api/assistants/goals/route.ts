import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";

type GoalAssistantBody = {
  date?: string;
  goalId?: string;
  progressUpdate?: string;
  timeSpentMinutes?: number;
  status?: "progressed" | "completed" | "blocked" | "delayed";
  progressDelta?: number;
  nextStep?: string;
  notes?: string;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function POST(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as GoalAssistantBody | null;
  if (!body?.progressUpdate?.trim()) return NextResponse.json({ error: "A progress update is required." }, { status: 400 });

  const prisma = getPrisma();
  const note = [
    `[${body.date ?? new Date().toISOString().slice(0, 10)}] ${body.progressUpdate}`,
    body.timeSpentMinutes ? `Time spent: ${body.timeSpentMinutes} minutes.` : undefined,
    body.status ? `Status: ${body.status}.` : undefined,
    body.nextStep ? `Next step: ${body.nextStep}` : undefined,
    body.notes
  ].filter(Boolean).join("\n");

  if (!body.goalId) {
    const journal = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        date: new Date(`${body.date ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
        mode: "Progress reflection",
        title: "Standalone goal progress note",
        content: note,
        completed: true
      }
    });
    return NextResponse.json({ data: { standalone: true, journal } }, { status: 201 });
  }

  const goal = await prisma.goal.findFirst({ where: { id: body.goalId, userId: user.id } });
  if (!goal) {
    const exists = await prisma.goal.findFirst({ where: { id: body.goalId } });
    return NextResponse.json({ error: exists ? "Forbidden" : "Goal not found" }, { status: exists ? 403 : 404 });
  }

  const nextProgress = body.status === "completed" ? 100 : clampProgress(goal.progressPercentage + (body.progressDelta ?? 0));
  const nextStatus = body.status === "completed" ? "Completed" : body.status === "blocked" || body.status === "delayed" ? "Paused" : goal.status;
  const data = await prisma.goal.update({
    where: { id: goal.id },
    data: {
      progressPercentage: nextProgress,
      status: nextStatus,
      weeklyReviewNotes: [goal.weeklyReviewNotes, note].filter(Boolean).join("\n\n")
    }
  });

  return NextResponse.json({ data }, { status: 200 });
}
