import { CoachPanel } from "@/components/coach-panel";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

export default async function AiCoachPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Rule-based coach"
        title="AI Coach"
        description="A placeholder coaching surface with modes for fitness, nutrition, productivity, mood, study, finance, and weekly review."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <CoachPanel data={data} />
        <Card>
          <SectionTitle title="Future Integration" />
          <div className="space-y-3 text-sm leading-6 text-muted">
            <p>No external AI API is called by default. The current coach uses transparent rule-based feedback from seed data.</p>
            <p>When environment variables are present, this page can be extended with a server route that sends summarized user data to a model provider.</p>
            <p>Medical, injury, mental health, diet, and financial topics should remain conservative and refer out to qualified professionals when stakes are high.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
