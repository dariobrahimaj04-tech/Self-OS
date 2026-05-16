import { CrudPanel } from "@/components/crud-panel";
import { PageHeader, StatCard } from "@/components/ui";
import { nutritionSummary } from "@/lib/analytics";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";
import { average } from "@/lib/utils";

export default async function NutritionPage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const summary = nutritionSummary(data.meals);
  const weeklyCalories = Math.round(average(data.meals.map((meal) => meal.calories)) * 3);

  return (
    <>
      <PageHeader
        eyebrow="Food and hydration"
        title="Nutrition Tracker"
        description="Log meals, macros, water, favorites, templates, and energy notes with health-focused language."
      />
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Calories Today" value={summary.calories} tone="blue" />
        <StatCard label="Protein Today" value={`${summary.protein}g`} tone="green" />
        <StatCard label="Carbs Today" value={`${summary.carbs}g`} />
        <StatCard label="Fats Today" value={`${summary.fats}g`} />
        <StatCard label="Weekly Avg" value={weeklyCalories} detail="Estimated calories" tone="amber" />
      </div>
      <CrudPanel
        title="Meal"
        subtitle="Moderate, sustainable tracking. No extreme restriction targets."
        resource="meals"
        initialRows={data.meals}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "mealType", label: "Meal Type", type: "select", options: ["Breakfast", "Lunch", "Dinner", "Snack"], required: true },
          { name: "foodName", label: "Food Name", required: true },
          { name: "calories", label: "Calories", type: "number", required: true },
          { name: "protein", label: "Protein", type: "number", required: true },
          { name: "carbs", label: "Carbs", type: "number", required: true },
          { name: "fats", label: "Fats", type: "number", required: true },
          { name: "waterLiters", label: "Water Liters", type: "number" },
          { name: "notes", label: "Notes", type: "textarea" },
          { name: "energyImpact", label: "Energy Impact" }
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "mealType", label: "Meal" },
          { key: "foodName", label: "Food" },
          { key: "calories", label: "Cal" },
          { key: "protein", label: "Protein" },
          { key: "energyImpact", label: "Energy" }
        ]}
      />
    </>
  );
}
