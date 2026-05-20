"use client";

import { useMemo, useState } from "react";
import { HabitCompletionChart } from "@/components/charts";
import { CrudPanel } from "@/components/crud-panel";
import { ModuleAssistant } from "@/components/module-assistant";
import { StatCard } from "@/components/ui";
import { analyticsSeries } from "@/lib/analytics";
import { parseHabitAssistantRequest, type HabitAssistantPreview } from "@/lib/module-assistant-parsers";
import type { HabitView } from "@/lib/types";
import { average } from "@/lib/utils";

const examples = [
  "I did gym, water, and studying, but missed reading.",
  "Completed workout and water today.",
  "I forgot reading but did everything else.",
  "Mark sleep, gym, and studying done.",
  "Missed meditation today."
];

function fieldClass() {
  return "focus-ring h-11 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink";
}

function areaClass() {
  return "focus-ring min-h-24 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm leading-6 text-ink";
}

function toHabit(row: Record<string, unknown>): HabitView {
  return {
    id: String(row.id),
    name: String(row.name ?? "Habit"),
    category: String(row.category ?? "General"),
    frequency: String(row.frequency ?? "Daily"),
    targetDays: Array.isArray(row.targetDays) ? row.targetDays.map(String) : [],
    streak: Number(row.streak ?? 0),
    weeklyCompletion: Number(row.weeklyCompletion ?? 0),
    monthlyCompletion: Number(row.monthlyCompletion ?? 0),
    completedToday: Boolean(row.completedToday),
    notes: typeof row.notes === "string" ? row.notes : undefined
  };
}

export function HabitsWorkspace({ initialHabits }: { initialHabits: HabitView[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [request, setRequest] = useState("");
  const [preview, setPreview] = useState<HabitAssistantPreview | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [appliedPreviewId, setAppliedPreviewId] = useState<string | null>(null);
  const weekly = average(habits.map((habit) => habit.weeklyCompletion));
  const monthly = average(habits.map((habit) => habit.monthlyCompletion));
  const bestStreak = Math.max(0, ...habits.map((habit) => habit.streak));
  const chartData = useMemo(() => analyticsSeries({ habits }).habits, [habits]);

  function updatePreview(patch: Partial<HabitAssistantPreview>) {
    setPreview((current) => (current ? { ...current, ...patch } : current));
    setAppliedPreviewId(null);
  }

  function parseRequest() {
    setPreview(parseHabitAssistantRequest(request, habits));
    setStatus(null);
    setAppliedPreviewId(null);
  }

  async function applyPreview() {
    if (!preview || saving || appliedPreviewId === preview.id) return;
    const completedHabitIds = preview.statuses.filter((item) => item.status === "completed").map((item) => item.habitId);
    const missedHabitIds = preview.statuses.filter((item) => item.status === "missed").map((item) => item.habitId);
    if (!completedHabitIds.length && !missedHabitIds.length) {
      setStatus("Choose at least one habit to mark complete or missed.");
      return;
    }
    setSaving(true);
    setStatus("Saving habit updates...");
    try {
      const response = await fetch("/api/assistants/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: preview.date,
          completedHabitIds,
          missedHabitIds,
          notes: preview.notes
        })
      });
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(json?.error ?? "Could not save habit updates.");
      setHabits((current) => current.map((habit) => {
        if (completedHabitIds.includes(habit.id)) {
          return {
            ...habit,
            completedToday: true,
            weeklyCompletion: Math.min(100, habit.weeklyCompletion + (habit.completedToday ? 0 : 14)),
            monthlyCompletion: Math.min(100, habit.monthlyCompletion + (habit.completedToday ? 0 : 3)),
            streak: habit.completedToday ? habit.streak : habit.streak + 1
          };
        }
        if (missedHabitIds.includes(habit.id)) {
          return {
            ...habit,
            completedToday: false,
            weeklyCompletion: Math.max(0, habit.weeklyCompletion - (habit.completedToday ? 14 : 0)),
            monthlyCompletion: Math.max(0, habit.monthlyCompletion - (habit.completedToday ? 3 : 0)),
            streak: 0
          };
        }
        return habit;
      }));
      setAppliedPreviewId(preview.id);
      setStatus("Saved habit updates for today.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save habit updates.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Weekly Completion" value={`${Math.round(weekly)}%`} tone="green" />
        <StatCard label="Monthly Completion" value={`${Math.round(monthly)}%`} tone="blue" />
        <StatCard label="Best Streak" value={`${bestStreak} days`} tone="amber" />
      </div>
      <div className="mb-5">
        <HabitCompletionChart data={chartData} />
      </div>
      <div className="mb-5">
        <ModuleAssistant
          moduleName="Habits"
          placeholder="Example: I did gym, water, and studying, but missed reading."
          examplePrompts={examples}
          request={request}
          onRequestChange={setRequest}
          onSubmit={parseRequest}
          loading={saving}
          preview={preview}
          status={status}
          applyLabel={saving ? "Saving..." : "Apply Habit Updates"}
          onApply={applyPreview}
          onCancel={() => {
            setPreview(null);
            setStatus("Preview cancelled. No habits were changed.");
          }}
          onClear={() => {
            setRequest("");
            setPreview(null);
            setStatus(null);
            setAppliedPreviewId(null);
          }}
          applyDisabled={saving || !preview || appliedPreviewId === preview.id}
          renderPreview={(item) => <HabitPreview preview={item} onChange={updatePreview} />}
        />
      </div>
      <CrudPanel
        title="Habit"
        resource="habits"
        initialRows={habits}
        rows={habits}
        onRowsChange={(rows) => setHabits(rows.map((row) => toHabit(row)))}
        fields={[
          { name: "name", label: "Habit Name", required: true },
          { name: "category", label: "Category", required: true },
          { name: "frequency", label: "Frequency", required: true },
          { name: "targetDays", label: "Target Days", array: true },
          { name: "notes", label: "Notes", type: "textarea" }
        ]}
        columns={[
          { key: "name", label: "Habit" },
          { key: "category", label: "Category" },
          { key: "frequency", label: "Frequency" },
          { key: "streak", label: "Streak" },
          { key: "weeklyCompletion", label: "Weekly %" },
          { key: "monthlyCompletion", label: "Monthly %" }
        ]}
      />
    </>
  );
}

function HabitPreview({ preview, onChange }: { preview: HabitAssistantPreview; onChange: (patch: Partial<HabitAssistantPreview>) => void }) {
  function updateStatus(habitId: string, status: HabitAssistantPreview["statuses"][number]["status"]) {
    onChange({
      statuses: preview.statuses.map((item) => item.habitId === habitId ? { ...item, status } : item)
    });
  }

  return (
    <div className="space-y-4">
      <label className="block max-w-xs">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Date</span>
        <input className={fieldClass()} type="date" value={preview.date} onChange={(event) => onChange({ date: event.target.value })} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        {preview.statuses.map((item) => (
          <label key={item.habitId} className="block rounded-lg border border-line bg-panel p-3">
            <span className="mb-2 block text-sm font-semibold text-ink">{item.habitName}</span>
            <select className={fieldClass()} value={item.status} onChange={(event) => updateStatus(item.habitId, event.target.value as HabitAssistantPreview["statuses"][number]["status"])}>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="ignore">Ignore</option>
            </select>
            <span className="mt-2 block text-xs text-muted">{item.confidence} match</span>
          </label>
        ))}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
        <textarea className={areaClass()} value={preview.notes} onChange={(event) => onChange({ notes: event.target.value })} />
      </label>
    </div>
  );
}
