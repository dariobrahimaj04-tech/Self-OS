import { CrudPanel } from "@/components/crud-panel";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

const dailyPrompts = [
  "What went well today?",
  "What felt difficult?",
  "What did I learn?",
  "What is one thing I can improve tomorrow?"
];

const weeklyPrompts = [
  "What improved this week?",
  "What did I avoid?",
  "What habits helped me?",
  "What should I change next week?",
  "What is the main focus for next week?"
];

export default async function JournalPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Reflection"
        title="Journal"
        description="Use structured modes for daily reflection, weekly review, goals, gratitude, lessons, and progress."
      />
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Daily Reflection Prompts" />
          <ul className="space-y-2 text-sm text-muted">
            {dailyPrompts.map((prompt) => (
              <li key={prompt} className="rounded-lg border border-line bg-surface p-3">{prompt}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle title="Weekly Review Prompts" />
          <ul className="space-y-2 text-sm text-muted">
            {weeklyPrompts.map((prompt) => (
              <li key={prompt} className="rounded-lg border border-line bg-surface p-3">{prompt}</li>
            ))}
          </ul>
        </Card>
      </div>
      <CrudPanel
        title="Journal Entry"
        resource="journalEntries"
        initialRows={data.journalEntries}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          {
            name: "mode",
            label: "Mode",
            type: "select",
            options: ["Daily reflection", "Weekly review", "Goal journal", "Emotional dump", "Gratitude", "Lessons learned", "Progress reflection"],
            required: true
          },
          { name: "title", label: "Title", required: true },
          { name: "content", label: "Content", type: "textarea", required: true }
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "mode", label: "Mode" },
          { key: "title", label: "Title" },
          { key: "content", label: "Content" }
        ]}
      />
    </>
  );
}
