import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";

const settingsSections = [
  {
    title: "Environment",
    items: ["DATABASE_URL is read from environment variables.", "Better Auth secrets and app URLs are environment-only.", "No AI API integration is enabled."]
  },
  {
    title: "Data",
    items: ["Seed data is attached to a demo user for local testing.", "CRUD routes are scoped to the active session user.", "Exercise data remains shared because it is not private user data."]
  },
  {
    title: "Safety",
    items: ["SelfOS does not provide medical advice.", "Pain or injury should reduce volume or trigger substitution.", "Major diet, medical, or financial decisions should involve qualified professionals."]
  }
];

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description={`Signed in as ${user.email ?? user.name ?? "SelfOS user"}. Environment, data, and safety defaults for this workspace.`}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Card key={section.title}>
            <SectionTitle title={section.title} />
            <ul className="space-y-3 text-sm leading-6 text-muted">
              {section.items.map((item) => (
                <li key={item} className="rounded-lg border border-line bg-surface p-3">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
