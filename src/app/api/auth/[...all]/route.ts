import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { databaseConfigured } from "@/lib/prisma";

const handlers = toNextJsHandler(auth);

function databaseRequired() {
  return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
}

export function GET(request: Request) {
  return databaseConfigured() ? handlers.GET(request) : databaseRequired();
}

export function POST(request: Request) {
  return databaseConfigured() ? handlers.POST(request) : databaseRequired();
}
