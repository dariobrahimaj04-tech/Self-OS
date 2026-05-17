import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { defaultFitnessSettings } from "@/lib/fitness-programming";
import { databaseConfigured, getPrisma } from "@/lib/prisma";
import { fitnessSettingsSchema } from "@/lib/validators";

export async function PUT(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = fitnessSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const prisma = getPrisma();
  const settings = await prisma.fitnessProgrammingSettings.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: {
      userId: user.id,
      ...parsed.data
    }
  });

  return NextResponse.json({ data: settings });
}

export async function GET(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const prisma = getPrisma();
  const settings = await prisma.fitnessProgrammingSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      ...defaultFitnessSettings
    }
  });

  return NextResponse.json({ data: settings });
}
