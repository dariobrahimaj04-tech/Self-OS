import { GoalsWorkspace } from "@/components/goals-workspace";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

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
      <GoalsWorkspace initialGoals={data.goals} />
    </>
  );
}
