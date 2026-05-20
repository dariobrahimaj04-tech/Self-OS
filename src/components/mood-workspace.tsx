"use client";

import { useMemo, useState } from "react";
import { MoodTrendChart, SleepMoodChart } from "@/components/charts";
import { CrudPanel } from "@/components/crud-panel";
import { ModuleAssistant } from "@/components/module-assistant";
import { parseMoodAssistantRequest, type MoodAssistantPreview } from "@/lib/module-assistant-parsers";
import type { MoodLogView } from "@/lib/types";

type ChartDatum = Record<string, string | number | boolean | null | undefined>;

const examples = [
  "I felt stressed but productive today.",
  "Today was good, I had energy and got things done.",
  "I felt tired and unmotivated.",
  "I was anxious earlier but better by the evening.",
  "I felt focused, calm, and proud of myself."
];

function fieldClass() {
  return "focus-ring h-11 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink";
}

function areaClass() {
  return "focus-ring min-h-24 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm leading-6 text-ink";
}

function toMoodLog(row: Record<string, unknown>): MoodLogView {
  return {
    id: String(row.id),
    date: typeof row.date === "string" ? row.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    mood: Number(row.mood ?? 5),
    energy: Number(row.energy ?? 5),
    stress: Number(row.stress ?? 5),
    sleepQuality: Number(row.sleepQuality ?? 5),
    socialConnection: Number(row.socialConnection ?? 5),
    anxietyLevel: Number(row.anxietyLevel ?? 5),
    productivity: Number(row.productivity ?? 5),
    notes: typeof row.notes === "string" ? row.notes : undefined
  };
}

export function MoodWorkspace({
  initialMoodLogs,
  initialSleepMood
}: {
  initialMoodLogs: MoodLogView[];
  initialSleepMood: ChartDatum[];
}) {
  const [moodLogs, setMoodLogs] = useState(initialMoodLogs);
  const [request, setRequest] = useState("");
  const [preview, setPreview] = useState<MoodAssistantPreview | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [appliedPreviewId, setAppliedPreviewId] = useState<string | null>(null);
  const moodSeries = useMemo(() => moodLogs.map((log) => ({
    date: log.date,
    mood: log.mood,
    stress: log.stress,
    energy: log.energy
  })), [moodLogs]);

  function updatePreview(patch: Partial<MoodAssistantPreview>) {
    setPreview((current) => (current ? { ...current, ...patch } : current));
    setAppliedPreviewId(null);
  }

  function parseRequest() {
    setPreview(parseMoodAssistantRequest(request));
    setStatus(null);
    setAppliedPreviewId(null);
  }

  async function applyPreview() {
    if (!preview || saving || appliedPreviewId === preview.id) return;
    setSaving(true);
    setStatus("Saving mood log...");
    try {
      const response = await fetch("/api/assistants/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview)
      });
      const json = (await response.json().catch(() => null)) as { data?: Record<string, unknown>; error?: string } | null;
      if (!response.ok || !json?.data) throw new Error(json?.error ?? "Could not save mood log.");
      const row = toMoodLog(json.data);
      setMoodLogs((current) => [row, ...current.filter((item) => item.id !== row.id)]);
      setAppliedPreviewId(preview.id);
      setStatus("Saved mood log.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save mood log.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <MoodTrendChart data={moodSeries} />
        <SleepMoodChart data={initialSleepMood} />
      </div>

      <div className="mb-5">
        <ModuleAssistant
          moduleName="Mood"
          placeholder="Example: I felt stressed but productive today."
          examplePrompts={examples}
          request={request}
          onRequestChange={setRequest}
          onSubmit={parseRequest}
          loading={saving}
          preview={preview}
          status={status}
          applyLabel={saving ? "Saving..." : "Save Mood Log"}
          onApply={applyPreview}
          onCancel={() => {
            setPreview(null);
            setStatus("Preview cancelled. No mood log was saved.");
          }}
          onClear={() => {
            setRequest("");
            setPreview(null);
            setStatus(null);
            setAppliedPreviewId(null);
          }}
          applyDisabled={saving || !preview || appliedPreviewId === preview.id}
          renderPreview={(item) => <MoodPreview preview={item} onChange={updatePreview} />}
        />
      </div>

      <CrudPanel
        title="Mood Log"
        resource="moodLogs"
        initialRows={moodLogs}
        rows={moodLogs}
        onRowsChange={(rows) => setMoodLogs(rows.map((row) => toMoodLog(row)))}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "mood", label: "Mood", type: "number", required: true },
          { name: "energy", label: "Energy", type: "number", required: true },
          { name: "stress", label: "Stress", type: "number", required: true },
          { name: "sleepQuality", label: "Sleep Quality", type: "number", required: true },
          { name: "socialConnection", label: "Social Connection", type: "number", required: true },
          { name: "anxietyLevel", label: "Anxiety", type: "number", required: true },
          { name: "productivity", label: "Productivity", type: "number", required: true },
          { name: "notes", label: "Notes", type: "textarea" }
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "mood", label: "Mood" },
          { key: "energy", label: "Energy" },
          { key: "stress", label: "Stress" },
          { key: "sleepQuality", label: "Sleep" },
          { key: "productivity", label: "Productivity" }
        ]}
      />
    </>
  );
}

function MoodPreview({ preview, onChange }: { preview: MoodAssistantPreview; onChange: (patch: Partial<MoodAssistantPreview>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Date</span>
          <input className={fieldClass()} type="date" value={preview.date} onChange={(event) => onChange({ date: event.target.value })} />
        </label>
        <NumberField label="Mood" value={preview.mood} onChange={(mood) => onChange({ mood })} />
        <NumberField label="Energy" value={preview.energy} onChange={(energy) => onChange({ energy })} />
        <NumberField label="Stress" value={preview.stress} onChange={(stress) => onChange({ stress })} />
        <NumberField label="Sleep Quality" value={preview.sleepQuality} onChange={(sleepQuality) => onChange({ sleepQuality })} />
        <NumberField label="Social" value={preview.socialConnection} onChange={(socialConnection) => onChange({ socialConnection })} />
        <NumberField label="Anxiety" value={preview.anxietyLevel} onChange={(anxietyLevel) => onChange({ anxietyLevel })} />
        <NumberField label="Productivity" value={preview.productivity} onChange={(productivity) => onChange({ productivity })} />
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Themes</span>
        <input className={fieldClass()} value={preview.themes.join(", ")} onChange={(event) => onChange({ themes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
        <textarea className={areaClass()} value={preview.notes} onChange={(event) => onChange({ notes: event.target.value })} />
      </label>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{label}</span>
      <input className={fieldClass()} type="number" min={1} max={10} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
