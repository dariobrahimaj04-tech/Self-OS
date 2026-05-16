import { SimpleBarChart } from "@/components/charts";
import { CrudPanel } from "@/components/crud-panel";
import { Card, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { analyticsSeries } from "@/lib/analytics";
import { requireUser } from "@/lib/auth-server";
import { getSelfOsData } from "@/lib/selfos-data";
import { currency, sum } from "@/lib/utils";

export default async function FinancePage() {
  const user = await requireUser();
  const data = await getSelfOsData(user.id);
  const income = sum(data.financeTransactions.filter((tx) => tx.type === "income").map((tx) => tx.amount));
  const expenses = sum(data.financeTransactions.filter((tx) => tx.type !== "income").map((tx) => tx.amount));
  const subscriptions = sum(data.financeTransactions.filter((tx) => tx.type === "subscription").map((tx) => tx.amount));

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Finance Tracker"
        description="Track income, expenses, categories, subscriptions, debts, savings goals, weekly spending, and monthly summaries."
      />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Income" value={currency(income)} tone="green" />
        <StatCard label="Outflow" value={currency(expenses)} tone="amber" />
        <StatCard label="Subscriptions" value={currency(subscriptions)} tone="blue" />
      </div>
      <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <SimpleBarChart title="Spending by Category" data={analyticsSeries(data).spendingByCategory} xKey="category" yKey="amount" />
        <Card>
          <SectionTitle title="Weekly Spending Review" />
          <div className="space-y-3 text-sm leading-6 text-muted">
            <p>Groceries are aligned with meal prep. Dining is the easiest flexible category to watch this week.</p>
            <p>Subscription review found a recurring software charge. Keep it only if it supports the current learning goal.</p>
            <p>Debt tracking is informational. For major financial decisions, use a qualified financial professional.</p>
          </div>
        </Card>
      </div>
      <CrudPanel
        title="Transaction"
        resource="financeTransactions"
        initialRows={data.financeTransactions}
        fields={[
          { name: "type", label: "Type", type: "select", options: ["income", "expense", "debt", "subscription"], required: true },
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "category", label: "Category", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "notes", label: "Notes", type: "textarea" }
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
          { key: "category", label: "Category" },
          { key: "amount", label: "Amount" },
          { key: "notes", label: "Notes" }
        ]}
      />
    </>
  );
}
