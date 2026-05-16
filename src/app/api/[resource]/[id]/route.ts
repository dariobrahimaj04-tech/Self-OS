import { NextResponse } from "next/server";
import { normalizeDates, parseResource, resourceConfig } from "@/lib/api-resources";
import { requireApiUser } from "@/lib/auth-server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";
import { schemas } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ resource: string; id: string }>;
};

type PrismaCrudDelegate = {
  findFirst(args: unknown): Promise<unknown | null>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

async function ensureOwned(model: PrismaCrudDelegate, id: string, userId: string) {
  const owned = await model.findFirst({ where: { id, userId } });
  if (owned) return { ok: true as const };

  const exists = await model.findFirst({ where: { id } });
  return { ok: false as const, status: exists ? 403 : 404 };
}

export async function GET(request: Request, context: RouteContext) {
  const { resource: resourceName, id } = await context.params;
  const resource = parseResource(resourceName);

  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const user = await requireApiUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!databaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  const config = resourceConfig[resource];
  const prisma = getPrisma();
  const model = prisma[config.model] as unknown as PrismaCrudDelegate;
  const data = await model.findFirst({
    where: { id, ...(config.needsUser ? { userId: user.id } : {}) }
  });

  if (!data) {
    const exists = await model.findFirst({ where: { id } });
    return NextResponse.json({ error: exists ? "Forbidden" : "Not found" }, { status: exists ? 403 : 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { resource: resourceName, id } = await context.params;
  const resource = parseResource(resourceName);

  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const user = await requireApiUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schemas[resource].partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (!databaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  const config = resourceConfig[resource];
  const prisma = getPrisma();
  const model = prisma[config.model] as unknown as PrismaCrudDelegate;
  const ownership = config.needsUser ? await ensureOwned(model, id, user.id) : { ok: true as const };
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.status === 403 ? "Forbidden" : "Not found" }, { status: ownership.status });
  }

  const data = await model.update({
    where: { id },
    data: normalizeDates(parsed.data, config.dateFields)
  });

  return NextResponse.json({ data });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { resource: resourceName, id } = await context.params;
  const resource = parseResource(resourceName);

  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const user = await requireApiUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!databaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  const config = resourceConfig[resource];
  const prisma = getPrisma();
  const model = prisma[config.model] as unknown as PrismaCrudDelegate;
  const ownership = config.needsUser ? await ensureOwned(model, id, user.id) : { ok: true as const };
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.status === 403 ? "Forbidden" : "Not found" }, { status: ownership.status });
  }

  await model.delete({ where: { id } });

  return NextResponse.json({ data: { id, deleted: true } });
}
