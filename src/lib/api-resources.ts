import type { PrismaClient } from "@prisma/client";
import { schemas, type CrudResource } from "./validators";

export const resourceConfig: Record<
  CrudResource,
  {
    model: keyof PrismaClient;
    orderBy?: Record<string, "asc" | "desc">;
    needsUser: boolean;
    dateFields?: string[];
  }
> = {
  dailyCheckIns: { model: "dailyCheckIn", orderBy: { date: "desc" }, needsUser: true, dateFields: ["date"] },
  meals: { model: "meal", orderBy: { date: "desc" }, needsUser: true, dateFields: ["date"] },
  moodLogs: { model: "moodLog", orderBy: { date: "desc" }, needsUser: true, dateFields: ["date"] },
  journalEntries: { model: "journalEntry", orderBy: { date: "desc" }, needsUser: true, dateFields: ["date"] },
  habits: { model: "habit", orderBy: { createdAt: "desc" }, needsUser: true },
  goals: { model: "goal", orderBy: { createdAt: "desc" }, needsUser: true, dateFields: ["startDate", "targetDate"] },
  learningItems: { model: "learningItem", orderBy: { updatedAt: "desc" }, needsUser: true },
  financeTransactions: { model: "financeTransaction", orderBy: { date: "desc" }, needsUser: true, dateFields: ["date"] },
  workoutLogs: { model: "workoutLog", orderBy: { date: "desc" }, needsUser: true, dateFields: ["date"] }
};

export function parseResource(value: string): CrudResource | null {
  return value in schemas ? (value as CrudResource) : null;
}

export function normalizeDates<T extends Record<string, unknown>>(data: T, dateFields: string[] = []) {
  return dateFields.reduce<Record<string, unknown>>(
    (acc, field) => {
      if (typeof acc[field] === "string" && acc[field]) {
        acc[field] = new Date(`${acc[field]}T00:00:00.000Z`);
      }
      return acc;
    },
    { ...data }
  );
}
