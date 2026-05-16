import { NextResponse } from "next/server";
import { databaseConfigured, getPrisma } from "@/lib/prisma";
import { normalizeDates, parseResource, resourceConfig } from "@/lib/api-resources";
import { requireApiUser } from "@/lib/auth-server";
import { schemas } from "@/lib/validators";

type PrismaCrudDelegate = {
  findMany(args?: unknown): Promise<unknown[]>;
  create(args: unknown): Promise<unknown>;
};

type RouteContext = {
  params: Promise<{ resource: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { resource: resourceName } = await context.params;
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
  const data = await model.findMany({
    where: config.needsUser ? { userId: user.id } : undefined,
    orderBy: config.orderBy
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request, context: RouteContext) {
  const { resource: resourceName } = await context.params;
  const resource = parseResource(resourceName);

  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const user = await requireApiUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schemas[resource].safeParse(body);

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
  const data = await model.create({
    data: {
      ...normalizeDates(parsed.data, config.dateFields),
      ...(config.needsUser ? { userId: user.id } : {})
    }
  });

  return NextResponse.json({ data }, { status: 201 });
}
