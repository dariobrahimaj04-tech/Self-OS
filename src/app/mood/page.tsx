import { MoodWorkspace } from "@/components/mood-workspace";
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
      <MoodWorkspace initialMoodLogs={data.moodLogs} initialSleepMood={series.sleepVsMood} />
    </>
  );
}
