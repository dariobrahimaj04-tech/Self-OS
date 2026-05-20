import { HabitsWorkspace } from "@/components/habits-workspace";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

export default async function HabitsPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Consistency"
        title="Habit Tracker"
        description="Track custom habits by category, frequency, target days, completion, streak, skip reason, and notes."
      />
      <HabitsWorkspace initialHabits={data.habits} />
    </>
  );
}
