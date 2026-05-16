import { SimpleBarChart } from "@/components/charts";
import { CrudPanel } from "@/components/crud-panel";
import { PageHeader, StatCard } from "@/components/ui";
import { analyticsSeries } from "@/lib/analytics";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";
import { average, sum } from "@/lib/utils";

export default async function LearningPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Skill growth"
        title="Learning Tracker"
        description="Track skills, courses, study minutes, confidence, resources, projects, and completion."
      />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Study Minutes" value={sum(data.learningItems.map((item) => item.studyMinutes))} tone="green" />
        <StatCard label="Avg Confidence" value={`${average(data.learningItems.map((item) => item.confidenceScore)).toFixed(1)}/10`} tone="blue" />
        <StatCard label="Avg Completion" value={`${Math.round(average(data.learningItems.map((item) => item.completionPercentage)))}%`} tone="amber" />
      </div>
      <div className="mb-5">
        <SimpleBarChart title="Study Minutes by Category" data={analyticsSeries(data).learning} xKey="name" yKey="minutes" />
      </div>
      <CrudPanel
        title="Learning Item"
        resource="learningItems"
        initialRows={data.learningItems}
        fields={[
          { name: "name", label: "Skill or Course", required: true },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: ["Python", "SQL", "Statistics", "Machine learning", "Excel", "Power BI", "GitHub", "Portfolio projects", "Communication", "Business"],
            required: true
          },
          { name: "currentLevel", label: "Current Level", required: true },
          { name: "targetLevel", label: "Target Level", required: true },
          { name: "studyMinutes", label: "Study Minutes", type: "number" },
          { name: "resourceLink", label: "Resource Link" },
          { name: "notes", label: "Notes", type: "textarea" },
          { name: "confidenceScore", label: "Confidence", type: "number", required: true },
          { name: "relatedProjects", label: "Related Projects", array: true },
          { name: "completionPercentage", label: "Completion %", type: "number", required: true }
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "studyMinutes", label: "Minutes" },
          { key: "confidenceScore", label: "Confidence" },
          { key: "completionPercentage", label: "Complete" }
        ]}
      />
    </>
  );
}
