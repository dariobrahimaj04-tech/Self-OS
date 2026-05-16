"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

type RowValue = string | number | boolean | string[] | null | undefined;
type Row = Record<string, RowValue>;
type FormValue = string | number;
type FormState = Record<string, FormValue>;

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  array?: boolean;
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
};

export function CrudPanel({
  title,
  subtitle,
  resource,
  fields,
  columns,
  initialRows,
  compact = false
}: {
  title: string;
  subtitle?: string;
  resource: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  initialRows: Row[];
  compact?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emptyForm = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.name, field.type === "number" ? 0 : field.type === "date" ? new Date().toISOString().slice(0, 10) : ""])
      ) as FormState,
    [fields]
  );
  const [form, setForm] = useState<FormState>(emptyForm);
  const editing = rows.find((row) => String(row.id) === editingId);

  function startEdit(row: Row) {
    setEditingId(String(row.id));
    setForm({
      ...emptyForm,
      ...Object.fromEntries(
        fields.map((field) => {
          const value = row[field.name];
          if (Array.isArray(value)) return [field.name, value.join(", ")];
          if (typeof value === "number" || typeof value === "string") return [field.name, value];
          if (typeof value === "boolean") return [field.name, String(value)];
          return [field.name, emptyForm[field.name] ?? ""];
        })
      )
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const payload = Object.fromEntries(
      fields.map((field) => {
        const raw = form[field.name];
        if (field.array) {
          return [
            field.name,
            String(raw ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          ];
        }
        return [field.name, field.type === "number" ? Number(raw) : raw];
      })
    );

    try {
      const response = await fetch(`/api/${resource}${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = (await response.json()) as { data: Row; error?: string };
      if (!response.ok) throw new Error(json.error ?? "Request failed");
      const nextRow = { ...(editing ?? {}), ...json.data };
      setRows((current) => (editingId ? current.map((row) => (String(row.id) === editingId ? nextRow : row)) : [nextRow, ...current]));
      cancelEdit();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setLoading(true);
    try {
      await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
      setRows((current) => current.filter((row) => String(row.id) !== id));
      if (editingId === id) cancelEdit();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(300px,420px)_1fr]">
      <Card>
        <SectionTitle title={editingId ? `Edit ${title}` : `Add ${title}`} subtitle={subtitle} />
        <form className="space-y-3" onSubmit={submit}>
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  className="focus-ring min-h-28 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
                  value={form[field.name] ?? ""}
                  required={field.required}
                  onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              ) : field.type === "select" ? (
                <select
                  className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink"
                  value={form[field.name] ?? ""}
                  required={field.required}
                  onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                >
                  <option value="">Select</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="focus-ring h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted"
                  type={field.type ?? "text"}
                  value={form[field.name] ?? ""}
                  required={field.required}
                  onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              )}
            </label>
          ))}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90 disabled:opacity-60 sm:w-auto"
              type="submit"
              disabled={loading}
            >
              {editingId ? <Check size={17} /> : <Plus size={17} />}
              {editingId ? "Save" : "Add"}
            </button>
            {editingId ? (
              <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-mineral/10 sm:w-auto" type="button" onClick={cancelEdit}>
                <X size={17} />
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="min-w-0">
        <SectionTitle title={`${title} Records`} />
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className={cn("w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm sm:min-w-[720px]", compact && "min-w-[560px]")}>
              <thead>
                <tr className="text-xs uppercase tracking-[0.11em] text-muted">
                  {columns.map((column) => (
                    <th key={column.key} className="border-b border-line px-3 py-2 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th className="border-b border-line px-3 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)} className="align-top">
                    {columns.map((column) => (
                      <td key={column.key} className="border-b border-line px-3 py-3 text-ink">
                        {column.render ? column.render(row) : String(row[column.key] ?? "")}
                      </td>
                    ))}
                    <td className="border-b border-line px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="focus-ring min-h-10 min-w-10 rounded-md border border-line bg-surface p-2 text-muted transition-colors hover:text-ink" type="button" onClick={() => startEdit(row)} aria-label="Edit row">
                          <Pencil size={16} />
                        </button>
                        <button className="focus-ring min-h-10 min-w-10 rounded-md border border-line bg-surface p-2 text-ember transition-colors hover:bg-ember/10" type="button" onClick={() => remove(String(row.id))} aria-label="Delete row">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No records yet" body="Add the first entry to start tracking this area." />
        )}
      </Card>
    </div>
  );
}
