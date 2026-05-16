"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { coachFeedback, coachModes, type CoachInput, type CoachMode } from "@/lib/coach";

export function CoachPanel({ data }: { data?: CoachInput }) {
  const [mode, setMode] = useState<CoachMode>("Weekly review coach");
  const feedback = coachFeedback(mode, data);

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle title="AI Coach Placeholder" subtitle="Rule-based for now; ready for a future API-backed coach." />
        <select
          className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink sm:w-auto"
          value={mode}
          onChange={(event) => setMode(event.target.value as CoachMode)}
        >
          {coachModes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {feedback.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg border border-line bg-surface p-3 text-sm leading-6">
            <Sparkles className="mt-0.5 shrink-0 text-mineral" size={17} />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
