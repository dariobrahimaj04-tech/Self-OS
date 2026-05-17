import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-server";
import { editWorkoutPlanWithNaturalLanguage } from "@/lib/fitness-program-editor";
import type { FitnessProgrammingSettings, FitnessProfileInput, GeneratedWorkoutPlan } from "@/lib/types";

type ProgramEditorBody = {
  request?: unknown;
  plan?: unknown;
  profile?: unknown;
  settings?: unknown;
};

export async function POST(request: Request) {
  const user = await requireApiUser(request.headers);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: ProgramEditorBody | null = null;
  try {
    body = JSON.parse(await request.text()) as ProgramEditorBody;
  } catch {
    return NextResponse.json(
      { error: "Could not read the change request. If it is very long, split it into smaller edits and preview them one at a time." },
      { status: 400 }
    );
  }

  if (typeof body.request !== "string" || !body.request.trim()) {
    return NextResponse.json({ error: "A natural-language change request is required." }, { status: 400 });
  }

  const plan = body.plan as GeneratedWorkoutPlan | undefined;
  const profile = body.profile as FitnessProfileInput | undefined;
  if (!plan?.days?.length || !profile?.trainingExperience) {
    return NextResponse.json({ error: "A current generated plan and fitness profile are required." }, { status: 400 });
  }

  const result = editWorkoutPlanWithNaturalLanguage({
    request: body.request,
    plan,
    profile,
    settings: (body.settings as FitnessProgrammingSettings | null | undefined) ?? null
  });

  return NextResponse.json({ data: result });
}
