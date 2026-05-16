import { CheckInForm } from "@/components/check-in-form";
import { PageHeader, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

export default async function CheckInPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Daily input"
        title="Daily Check-In"
        description="Track mood, energy, stress, sleep, productivity, social connection, hydration, and notes."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <CheckInForm />
        <Card>
          <SectionTitle title="Recent Check-Ins" />
          {data.checkIns.length ? (
            <div className="space-y-3">
              {data.checkIns.slice(0, 5).map((entry) => (
              <div key={entry.date} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{entry.date}</p>
                  <p className="text-sm text-muted">Mood {entry.moodScore}/10</p>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">{entry.notes}</p>
              </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No check-ins yet" body="Save your first daily check-in to start the trend line." />
          )}
        </Card>
      </div>
    </>
  );
}
