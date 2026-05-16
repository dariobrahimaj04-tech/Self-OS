import { HabitCompletionChart } from "@/components/charts";
import { CrudPanel } from "@/components/crud-panel";
import { PageHeader, StatCard } from "@/components/ui";
import { analyticsSeries } from "@/lib/analytics";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";
import { average } from "@/lib/utils";

export default async function HabitsPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const weekly = average(data.habits.map((habit) => habit.weeklyCompletion));
  const monthly = average(data.habits.map((habit) => habit.monthlyCompletion));
  const bestStreak = Math.max(0, ...data.habits.map((habit) => habit.streak));

  return (
    <>
      <PageHeader
        eyebrow="Consistency"
        title="Habit Tracker"
        description="Track custom habits by category, frequency, target days, completion, streak, skip reason, and notes."
      />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Weekly Completion" value={`${Math.round(weekly)}%`} tone="green" />
        <StatCard label="Monthly Completion" value={`${Math.round(monthly)}%`} tone="blue" />
        <StatCard label="Best Streak" value={`${bestStreak} days`} tone="amber" />
      </div>
      <div className="mb-5">
        <HabitCompletionChart data={analyticsSeries(data).habits} />
      </div>
      <CrudPanel
        title="Habit"
        resource="habits"
        initialRows={data.habits}
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
