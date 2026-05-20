"use client";

import { useState } from "react";
import { CrudPanel } from "@/components/crud-panel";
import { ModuleAssistant } from "@/components/module-assistant";
import { Card, ProgressBar, SectionTitle, StatCard } from "@/components/ui";
import { parseGoalAssistantRequest, type GoalAssistantPreview } from "@/lib/module-assistant-parsers";
import type { GoalView } from "@/lib/types";
import { average } from "@/lib/utils";

const examples = [
  "I worked on my website project for 2 hours and made progress.",
  "Finished part of my data science course today.",
  "Made progress on SelfOS but didn't finish the dashboard.",
  "Studied Python for 45 minutes.",
  "I completed the landing page task."
];

function fieldClass() {
  return "focus-ring h-11 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink";
}

function areaClass() {
  return "focus-ring min-h-24 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm leading-6 text-ink";
}

function toGoal(row: Record<string, unknown>): GoalView {
  return {
    id: String(row.id),
    title: String(row.title ?? "Goal"),
    category: String(row.category ?? "General"),
    description: String(row.description ?? ""),
    startDate: typeof row.startDate === "string" ? row.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    targetDate: typeof row.targetDate === "string" ? row.targetDate.slice(0, 10) : "",
    priority: String(row.priority ?? "Medium"),
    status: String(row.status ?? "Active"),
    progressPercentage: Number(row.progressPercentage ?? 0),
    milestones: Array.isArray(row.milestones) ? row.milestones.map(String) : [],
    tasks: Array.isArray(row.tasks) ? row.tasks.map(String) : [],
    weeklyReviewNotes: typeof row.weeklyReviewNotes === "string" ? row.weeklyReviewNotes : undefined
  };
}

export function GoalsWorkspace({ initialGoals }: { initialGoals: GoalView[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [request, setRequest] = useState("");
  const [preview, setPreview] = useState<GoalAssistantPreview | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [appliedPreviewId, setAppliedPreviewId] = useState<string | null>(null);

  function updatePreview(patch: Partial<GoalAssistantPreview>) {
    setPreview((current) => (current ? { ...current, ...patch } : current));
    setAppliedPreviewId(null);
  }

  function parseRequest() {
    setPreview(parseGoalAssistantRequest(request, goals));
    setStatus(null);
    setAppliedPreviewId(null);
  }

  async function applyPreview() {
    if (!preview || saving || appliedPreviewId === preview.id) return;
    setSaving(true);
    setStatus(preview.goalId ? "Saving goal progress..." : "Saving standalone progress note...");
    try {
      const response = await fetch("/api/assistants/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview)
      });
      const json = (await response.json().catch(() => null)) as { data?: Record<string, unknown>; error?: string } | null;
      if (!response.ok || !json?.data) throw new Error(json?.error ?? "Could not save goal progress.");
      if (!json.data.standalone) {
        const row = toGoal(json.data);
        setGoals((current) => current.map((goal) => goal.id === row.id ? { ...goal, ...row } : goal));
      }
      setAppliedPreviewId(preview.id);
      setStatus(preview.goalId ? "Saved goal progress." : "Saved as a standalone journal progress note.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save goal progress.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Active Goals" value={goals.length} tone="green" />
        <StatCard label="Average Progress" value={`${Math.round(average(goals.map((goal) => goal.progressPercentage)))}%`} tone="blue" />
        <StatCard label="High Priority" value={goals.filter((goal) => goal.priority === "High").length} tone="amber" />
      </div>

      <div className="mb-5">
        <ModuleAssistant
          moduleName="Goals"
          placeholder="Example: I worked on my website project for 2 hours and made progress."
          examplePrompts={examples}
          request={request}
          onRequestChange={setRequest}
          onSubmit={parseRequest}
          loading={saving}
          preview={preview}
          status={status}
          applyLabel={saving ? "Saving..." : "Save Progress"}
          onApply={applyPreview}
          onCancel={() => {
            setPreview(null);
            setStatus("Preview cancelled. No goal progress was saved.");
          }}
          onClear={() => {
            setRequest("");
            setPreview(null);
            setStatus(null);
            setAppliedPreviewId(null);
          }}
          applyDisabled={saving || !preview || appliedPreviewId === preview.id}
          renderPreview={(item) => <GoalPreview preview={item} goals={goals} onChange={updatePreview} />}
        />
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <SectionTitle title={goal.title} subtitle={`${goal.category} | ${goal.priority} priority`} />
            <p className="mb-4 text-sm leading-6 text-muted">{goal.description}</p>
            <ProgressBar value={goal.progressPercentage} label={`${goal.progressPercentage}% complete`} />
            <div className="mt-4 text-sm">
              <p className="font-medium">Next tasks</p>
              <ul className="mt-2 space-y-1 text-muted">
                {goal.tasks.slice(0, 3).map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <CrudPanel
        title="Goal"
        resource="goals"
        initialRows={goals}
        rows={goals}
        onRowsChange={(rows) => setGoals(rows.map((row) => toGoal(row)))}
        fields={[
          { name: "title", label: "Goal Title", required: true },
          { name: "category", label: "Category", required: true },
          { name: "description", label: "Description", type: "textarea" },
          { name: "startDate", label: "Start Date", type: "date", required: true },
          { name: "targetDate", label: "Target Date", type: "date" },
          { name: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High"], required: true },
          { name: "status", label: "Status", type: "select", options: ["Active", "Paused", "Completed"], required: true },
          { name: "progressPercentage", label: "Progress %", type: "number", required: true },
          { name: "weeklyReviewNotes", label: "Weekly Review Notes", type: "textarea" }
        ]}
        columns={[
          { key: "title", label: "Goal" },
          { key: "category", label: "Category" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "progressPercentage", label: "Progress" },
          { key: "targetDate", label: "Target" }
        ]}
      />
    </>
  );
}

function GoalPreview({
  preview,
  goals,
  onChange
}: {
  preview: GoalAssistantPreview;
  goals: GoalView[];
  onChange: (patch: Partial<GoalAssistantPreview>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Date</span>
          <input className={fieldClass()} type="date" value={preview.date} onChange={(event) => onChange({ date: event.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Related Goal</span>
          <select className={fieldClass()} value={preview.goalId} onChange={(event) => onChange({ goalId: event.target.value })}>
            <option value="">Standalone progress note</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Status</span>
          <select className={fieldClass()} value={preview.status} onChange={(event) => onChange({ status: event.target.value as GoalAssistantPreview["status"] })}>
            <option value="progressed">Progressed</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="delayed">Delayed</option>
          </select>
        </label>
        <NumberField label="Minutes" value={preview.timeSpentMinutes} min={0} max={1440} onChange={(timeSpentMinutes) => onChange({ timeSpentMinutes })} />
        <NumberField label="Progress +%" value={preview.progressDelta} min={0} max={100} onChange={(progressDelta) => onChange({ progressDelta })} />
      </div>
      {preview.candidateGoals.length ? (
        <div className="rounded-lg border border-line bg-panel p-3 text-sm leading-6 text-muted">
          Candidate matches: {preview.candidateGoals.map((goal) => `${goal.title} (${Math.round(goal.score * 100)}%)`).join(", ")}
        </div>
      ) : null}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Progress Update</span>
        <textarea className={areaClass()} value={preview.progressUpdate} onChange={(event) => onChange({ progressUpdate: event.target.value })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Next Step</span>
        <input className={fieldClass()} value={preview.nextStep} onChange={(event) => onChange({ nextStep: event.target.value })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
        <textarea className={areaClass()} value={preview.notes} onChange={(event) => onChange({ notes: event.target.value })} />
      </label>
    </div>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{label}</span>
      <input className={fieldClass()} type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
