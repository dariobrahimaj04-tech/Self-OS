"use client";

import { AlertTriangle, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

export type AssistantConfidence = "high" | "medium" | "low";

export type ModuleAssistantPreview = {
  title: string;
  summary?: string;
  confidence?: AssistantConfidence;
  warnings?: string[];
};

const confidenceStyles: Record<AssistantConfidence, string> = {
  high: "border-evergreen/30 bg-evergreen/10 text-evergreen",
  medium: "border-gold/30 bg-gold/10 text-gold",
  low: "border-ember/30 bg-ember/10 text-ember"
};

export function ModuleAssistant<TPreview extends ModuleAssistantPreview>({
  moduleName,
  placeholder,
  examplePrompts,
  request,
  onRequestChange,
  onSubmit,
  loading = false,
  preview,
  status,
  applyLabel = "Apply",
  cancelLabel = "Cancel",
  clearLabel = "Clear",
  onApply,
  onCancel,
  onClear,
  applyDisabled = false,
  renderPreview
}: {
  moduleName: string;
  placeholder: string;
  examplePrompts: string[];
  request: string;
  onRequestChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  preview: TPreview | null;
  status?: string | null;
  applyLabel?: string;
  cancelLabel?: string;
  clearLabel?: string;
  onApply?: () => void;
  onCancel?: () => void;
  onClear?: () => void;
  applyDisabled?: boolean;
  renderPreview: (preview: TPreview) => React.ReactNode;
}) {
  const warnings = preview?.warnings?.filter(Boolean) ?? [];

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mineral/10 text-mineral ring-1 ring-mineral/30">
            <Sparkles size={18} />
          </span>
          <SectionTitle
            title={`${moduleName} Assistant`}
            subtitle="Rule-based preview first. Nothing important is saved until you apply it."
          />
        </div>
        {preview?.confidence ? (
          <span className={cn("inline-flex h-9 items-center rounded-md border px-3 text-xs font-semibold uppercase tracking-[0.11em]", confidenceStyles[preview.confidence])}>
            {preview.confidence} confidence
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.11em] text-muted">Request</span>
            <textarea
              className="focus-ring min-h-28 w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6 text-ink placeholder:text-muted"
              placeholder={placeholder}
              value={request}
              onChange={(event) => onRequestChange(event.target.value)}
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-mineral px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-mineral/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              type="button"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              Preview
            </button>
            {onCancel ? (
              <button
                className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-mineral/10 sm:w-auto"
                type="button"
                onClick={onCancel}
              >
                <X size={17} />
                {cancelLabel}
              </button>
            ) : null}
            {onClear ? (
              <button
                className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-muted transition-colors hover:text-ink sm:w-auto"
                type="button"
                onClick={onClear}
              >
                {clearLabel}
              </button>
            ) : null}
          </div>
          {status ? <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6 text-muted">{status}</p> : null}
        </div>

        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted">Examples</p>
          <div className="mt-3 flex flex-col gap-2">
            {examplePrompts.map((example) => (
              <button
                key={example}
                className="focus-ring rounded-md border border-line bg-panel px-3 py-2 text-left text-sm leading-5 text-muted transition-colors hover:border-mineral/40 hover:text-ink"
                type="button"
                onClick={() => onRequestChange(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {preview ? (
        <div className="mt-4 rounded-lg border border-line bg-surface p-3">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-ink">{preview.title}</p>
              {preview.summary ? <p className="mt-1 text-sm leading-6 text-muted">{preview.summary}</p> : null}
            </div>
            {onApply ? (
              <button
                className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-evergreen px-4 text-sm font-semibold text-[#041018] transition-colors hover:bg-evergreen/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                type="button"
                onClick={onApply}
                disabled={applyDisabled || loading}
              >
                <CheckCircle2 size={17} />
                {applyLabel}
              </button>
            ) : null}
          </div>

          {renderPreview(preview)}

          {warnings.length ? (
            <div className="mt-3 space-y-2">
              {warnings.map((warning) => (
                <p key={warning} className="flex gap-2 rounded-md border border-gold/30 bg-gold/10 p-3 text-sm leading-6 text-ink">
                  <AlertTriangle size={16} className="mt-1 shrink-0 text-gold" />
                  <span>{warning}</span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
