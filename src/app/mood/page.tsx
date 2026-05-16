import { MoodTrendChart, SleepMoodChart } from "@/components/charts";
import { CrudPanel } from "@/components/crud-panel";
import { PageHeader } from "@/components/ui";
import { analyticsSeries } from "@/lib/analytics";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

export default async function MoodPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const series = analyticsSeries(data);

  return (
    <>
      <PageHeader
        eyebrow="Mental state"
        title="Mood Tracker"
        description="Track mood, energy, stress, sleep quality, social connection, anxiety, productivity, and notes over time."
      />
      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <MoodTrendChart data={series.moodLogs} />
        <SleepMoodChart data={series.sleepVsMood} />
      </div>
      <CrudPanel
        title="Mood Log"
        resource="moodLogs"
        initialRows={data.moodLogs}
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
