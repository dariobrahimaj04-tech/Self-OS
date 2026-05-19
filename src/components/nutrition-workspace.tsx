"use client";

import { useMemo, useState } from "react";
import { CrudPanel } from "@/components/crud-panel";
import { ModuleAssistant } from "@/components/module-assistant";
import { Card, SectionTitle, StatCard } from "@/components/ui";
import { nutritionSummary } from "@/lib/analytics";
import { parseNutritionAssistantRequest, type NutritionAssistantPreview } from "@/lib/nutrition-assistant";
import type { MealView } from "@/lib/types";
import { average } from "@/lib/utils";

const examples = [
  "I had 3 eggs, 2 slices of toast, and a banana.",
  "Add 200g grilled chicken with rice.",
  "I ate a chicken shawarma bowl.",
  "Add a protein shake with milk and banana.",
  "Log a turkey sandwich and Greek yogurt."
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fieldClass() {
  return "focus-ring h-11 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink";
}

function areaClass() {
  return "focus-ring min-h-24 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm leading-6 text-ink";
}

function toMealView(row: Record<string, unknown>): MealView {
  return {
    id: String(row.id),
    date: typeof row.date === "string" ? row.date.slice(0, 10) : todayIso(),
    mealType: String(row.mealType ?? "Snack"),
    foodName: String(row.foodName ?? "Assistant meal estimate"),
    calories: Number(row.calories ?? 0),
    protein: Number(row.protein ?? 0),
    carbs: Number(row.carbs ?? 0),
    fats: Number(row.fats ?? 0),
    waterLiters: row.waterLiters === null || row.waterLiters === undefined ? undefined : Number(row.waterLiters),
    notes: typeof row.notes === "string" ? row.notes : undefined,
    energyImpact: typeof row.energyImpact === "string" ? row.energyImpact : undefined,
    favorite: Boolean(row.favorite)
  };
}

export function NutritionWorkspace({ initialMeals }: { initialMeals: MealView[] }) {
  const [meals, setMeals] = useState(initialMeals);
  const [request, setRequest] = useState("");
  const [preview, setPreview] = useState<NutritionAssistantPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [appliedPreviewId, setAppliedPreviewId] = useState<string | null>(null);

  const summary = useMemo(() => nutritionSummary(meals), [meals]);
  const weeklyCalories = Math.round(average(meals.map((meal) => meal.calories)) * 3);
  const todaysMeals = meals.filter((meal) => meal.date === todayIso());

  function updatePreview(patch: Partial<NutritionAssistantPreview>) {
    setPreview((current) => (current ? { ...current, ...patch } : current));
    setAppliedPreviewId(null);
  }

  function parseRequest() {
    setLoading(true);
    setStatus(null);
    const nextPreview = parseNutritionAssistantRequest(request);
    setPreview(nextPreview);
    setAppliedPreviewId(null);
    setLoading(false);
  }

  function cancelPreview() {
    setPreview(null);
    setStatus("Preview cancelled. No meal was saved.");
  }

  function clearAssistant() {
    setRequest("");
    setPreview(null);
    setStatus(null);
    setAppliedPreviewId(null);
  }

  async function applyPreview() {
    if (!preview || applying || appliedPreviewId === preview.id) return;
    setApplying(true);
    setStatus("Saving estimate to today's nutrition log...");
    const payload = {
      date: todayIso(),
      mealType: preview.mealType,
      foodName: preview.mealName,
      calories: Math.max(0, Math.round(preview.calories)),
      protein: Math.max(0, Number(preview.protein)),
      carbs: Math.max(0, Number(preview.carbs)),
      fats: Math.max(0, Number(preview.fats)),
      notes: preview.notes,
      energyImpact: `Assistant estimate (${preview.confidence ?? "low"} confidence)`,
      favorite: false
    };

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = (await response.json().catch(() => null)) as { data?: Record<string, unknown>; error?: string } | null;
      if (!response.ok || !json?.data) throw new Error(json?.error ?? "Could not save meal.");
      const row = toMealView(json.data);
      setMeals((current) => (current.some((meal) => meal.id === row.id) ? current : [row, ...current]));
      setAppliedPreviewId(preview.id);
      setStatus("Saved to today's nutrition log.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save meal.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Calories Today" value={summary.calories} tone="blue" />
        <StatCard label="Protein Today" value={`${summary.protein}g`} tone="green" />
        <StatCard label="Carbs Today" value={`${summary.carbs}g`} />
        <StatCard label="Fats Today" value={`${summary.fats}g`} />
        <StatCard label="Weekly Avg" value={weeklyCalories} detail="Estimated calories" tone="amber" />
      </div>

      <div className="mb-5">
        <ModuleAssistant
          moduleName="Nutrition"
          placeholder="Example: I had 3 eggs, 2 slices of toast, and a banana."
          examplePrompts={examples}
          request={request}
          onRequestChange={setRequest}
          onSubmit={parseRequest}
          loading={loading || applying}
          preview={preview}
          status={status}
          applyLabel={applying ? "Saving..." : "Apply to Today"}
          cancelLabel="Cancel"
          clearLabel="Clear"
          onApply={applyPreview}
          onCancel={cancelPreview}
          onClear={clearAssistant}
          applyDisabled={applying || !preview || appliedPreviewId === preview.id}
          renderPreview={(item) => (
            <NutritionPreview
              preview={item}
              onChange={updatePreview}
            />
          )}
        />
      </div>

      {todaysMeals.length ? (
        <div className="mb-5">
          <Card>
            <SectionTitle title="Today's Nutrition Log" subtitle="Assistant-created meals appear here immediately after saving." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {todaysMeals.slice(0, 6).map((meal) => (
                <div key={meal.id} className="rounded-lg border border-line bg-surface p-3">
                  <p className="font-semibold text-ink">{meal.foodName}</p>
                  <p className="mt-1 text-xs text-muted">{meal.mealType}</p>
                  <p className="mt-2 text-sm text-muted">
                    Est. {meal.calories} cal, {meal.protein}g protein, {meal.carbs}g carbs, {meal.fats}g fat
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <CrudPanel
        title="Meal"
        subtitle="Moderate, sustainable tracking. No extreme restriction targets."
        resource="meals"
        initialRows={meals}
        rows={meals}
        onRowsChange={(rows) => setMeals(rows.map((row) => toMealView(row)))}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "mealType", label: "Meal Type", type: "select", options: ["Breakfast", "Lunch", "Dinner", "Snack"], required: true },
          { name: "foodName", label: "Food Name", required: true },
          { name: "calories", label: "Calories", type: "number", required: true },
          { name: "protein", label: "Protein", type: "number", required: true },
          { name: "carbs", label: "Carbs", type: "number", required: true },
          { name: "fats", label: "Fats", type: "number", required: true },
          { name: "waterLiters", label: "Water Liters", type: "number" },
          { name: "notes", label: "Notes", type: "textarea" },
          { name: "energyImpact", label: "Energy Impact" }
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "mealType", label: "Meal" },
          { key: "foodName", label: "Food" },
          { key: "calories", label: "Cal" },
          { key: "protein", label: "Protein" },
          { key: "energyImpact", label: "Energy" }
        ]}
      />
    </>
  );
}

function NutritionPreview({
  preview,
  onChange
}: {
  preview: NutritionAssistantPreview;
  onChange: (patch: Partial<NutritionAssistantPreview>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Meal Name</span>
          <input className={fieldClass()} value={preview.mealName} onChange={(event) => onChange({ mealName: event.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Meal Type</span>
          <select className={fieldClass()} value={preview.mealType} onChange={(event) => onChange({ mealType: event.target.value as NutritionAssistantPreview["mealType"] })}>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
        </label>
        <NumberField label="Calories" value={preview.calories} onChange={(calories) => onChange({ calories })} />
        <NumberField label="Protein" value={preview.protein} onChange={(protein) => onChange({ protein })} />
        <NumberField label="Carbs" value={preview.carbs} onChange={(carbs) => onChange({ carbs })} />
        <NumberField label="Fat" value={preview.fats} onChange={(fats) => onChange({ fats })} />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
        <textarea className={areaClass()} value={preview.notes} onChange={(event) => onChange({ notes: event.target.value })} />
      </label>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">Estimated Items</p>
          <div className="mt-3 space-y-2">
            {preview.items.map((item) => (
              <p key={`${item.name}-${item.quantityLabel}`} className="rounded-md border border-line bg-surface p-3 text-sm leading-6 text-muted">
                <span className="font-semibold text-ink">{item.name}</span> ({item.quantityLabel}): est. {item.calories} cal, {item.protein}g protein, {item.carbs}g carbs, {item.fats}g fat.
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">Assumptions</p>
          <div className="mt-3 space-y-2">
            {(preview.assumptions.length ? preview.assumptions : ["Serving sizes looked clear enough for a higher-confidence estimate."]).map((assumption) => (
              <p key={assumption} className="rounded-md border border-line bg-surface p-3 text-sm leading-6 text-muted">
                {assumption}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{label}</span>
      <input className={fieldClass()} type="number" value={value} min={0} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
