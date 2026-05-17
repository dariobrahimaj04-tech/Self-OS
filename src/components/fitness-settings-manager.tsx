"use client";

import { FormEvent, useState } from "react";
import { FitnessSettingsForm } from "@/components/fitness-programming-workspace";
import { defaultFitnessSettings } from "@/lib/fitness-programming";
import type { FitnessProgrammingSettings } from "@/lib/types";

export function FitnessSettingsManager({
  initialSettings
}: {
  initialSettings: FitnessProgrammingSettings | null;
}) {
  const [settings, setSettings] = useState<FitnessProgrammingSettings>({
    ...defaultFitnessSettings,
    ...(initialSettings ?? {})
  });
  const [status, setStatus] = useState<string | null>(null);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving fitness programming settings...");
    const response = await fetch("/api/fitness/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    setStatus(response.ok ? "Fitness programming settings saved." : "Could not save settings. Check your session and database connection.");
  }

  return <FitnessSettingsForm compact settings={settings} setSettings={setSettings} onSubmit={saveSettings} status={status} />;
}
