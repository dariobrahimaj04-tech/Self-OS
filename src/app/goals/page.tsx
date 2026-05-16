import { CrudPanel } from "@/components/crud-panel";
import { Card, PageHeader, ProgressBar, SectionTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";
import { average } from "@/lib/utils";

export default async function GoalsPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Direction"
        title="Goal Management"
        description="Manage goals with priority, status, progress, milestones, tasks, related habits, and weekly review notes."
      />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Active Goals" value={data.goals.length} tone="green" />
        <StatCard label="Average Progress" value={`${Math.round(average(data.goals.map((goal) => goal.progressPercentage)))}%`} tone="blue" />
        <StatCard label="High Priority" value={data.goals.filter((goal) => goal.priority === "High").length} tone="amber" />
      </div>
      <div className="mb-5 grid gap-4 xl:grid-cols-3">
        {data.goals.map((goal) => (
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
        initialRows={data.goals}
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
