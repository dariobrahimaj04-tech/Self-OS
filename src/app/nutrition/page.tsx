import { NutritionWorkspace } from "@/components/nutrition-workspace";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";

export default async function NutritionPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Food and hydration"
        title="Nutrition Tracker"
        description="Log meals, macros, water, favorites, templates, and energy notes with health-focused language."
      />
      <NutritionWorkspace initialMeals={data.meals} />
    </>
  );
}
