"use client";

import type { VerEAgirOccurrence } from "../types";

type EvaluationContextCardProps = {
  occurrence: VerEAgirOccurrence;
};

function ContextField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <p className="whitespace-pre-wrap text-sm text-gray-100">{value}</p>
    </div>
  );
}

export function EvaluationContextCard({ occurrence }: EvaluationContextCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-950/40 p-4">
      <ContextField label="Condição insegura" value={occurrence.conditionDescription} />
      <ContextField
        label="Ação imediata"
        value={occurrence.immediateActionDescription?.trim() || "—"}
      />
      {occurrence.assignedEvaluatorName ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Avaliador
          </span>
          <span className="text-sm text-gray-100">{occurrence.assignedEvaluatorName}</span>
        </div>
      ) : null}
    </div>
  );
}
