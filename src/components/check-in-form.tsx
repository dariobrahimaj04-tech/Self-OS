"use client";

import { Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { dailyCheckInSchema } from "@/lib/validators";
import { todayIso } from "@/lib/utils";

const fields = [
  ["moodScore", "Mood"],
  ["energyScore", "Energy"],
  ["stressScore", "Stress"],
  ["sleepQuality", "Sleep Quality"],
  ["productivityScore", "Productivity"],
  ["socialConnectionScore", "Social Connection"]
] as const;

export function CheckInForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: todayIso(),
    moodScore: 7,
    energyScore: 7,
    stressScore: 4,
    sleepHours: 7.5,
    sleepQuality: 7,
    productivityScore: 7,
    socialConnectionScore: 6,
    waterIntakeLiters: 2.2,
    notes: ""
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const parsed = dailyCheckInSchema.safeParse(form);
    if (!parsed.success) {
      setStatus("Please keep scores between 1 and 10 and sleep/water in realistic ranges.");
      return;
    }

    const response = await fetch("/api/dailyCheckIns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data)
    });

    setStatus(response.ok ? "Check-in saved." : "Could not save the check-in.");
  }

  return (
    <Card>
      <SectionTitle title="Daily Check-In" subtitle="Scores use a 1 to 10 scale." />
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Date</span>
          <input
            className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink"
            type="date"
            value={form.date}
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Sleep Hours</span>
          <input
            className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink"
            type="number"
            min="0"
            max="24"
            step="0.1"
            value={form.sleepHours}
            onChange={(event) => setForm((current) => ({ ...current, sleepHours: Number(event.target.value) }))}
          />
        </label>
        {fields.map(([name, label]) => (
          <label key={name} className="block">
            <span className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-[0.11em] text-muted">
              <span>{label}</span>
              <span>{form[name]}/10</span>
            </span>
            <input
              className="w-full accent-mineral"
              type="range"
              min="1"
              max="10"
              value={form[name]}
              onChange={(event) => setForm((current) => ({ ...current, [name]: Number(event.target.value) }))}
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Water Intake Liters</span>
          <input
            className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink"
            type="number"
            min="0"
            max="12"
            step="0.1"
            value={form.waterIntakeLiters}
            onChange={(event) => setForm((current) => ({ ...current, waterIntakeLiters: Number(event.target.value) }))}
          />
        </label>
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Notes</span>
          <textarea
            className="focus-ring min-h-32 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-2">
          <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90 sm:w-auto" type="submit">
            <Save size={17} />
            Save Check-In
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>
    </Card>
  );
}
