import type { MdhoCatalogCategory } from "@safestop/types";

import type { MdhoAssessmentEnriched } from "../types";

type MdhoSummaryProps = {
  assessment: MdhoAssessmentEnriched;
  categories: MdhoCatalogCategory[];
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function resolveSelectionLabels(
  assessment: MdhoAssessmentEnriched,
  categories: MdhoCatalogCategory[],
): Array<{ categoryName: string; labels: string[] }> {
  return categories.map((category) => {
    const selectedOptionIds = new Set(
      (assessment.selections ?? [])
        .filter((selection) => selection.categoryId === category.id)
        .map((selection) => selection.optionId),
    );

    const labels = category.options
      .filter((option) => selectedOptionIds.has(option.id))
      .map((option) => {
        const selection = assessment.selections?.find(
          (item) => item.categoryId === category.id && item.optionId === option.id,
        );
        if (selection?.detail?.trim()) {
          return `${option.label}: ${selection.detail.trim()}`;
        }
        return option.label;
      });

    return { categoryName: category.name, labels };
  });
}

export function MdhoSummary({ assessment, categories }: MdhoSummaryProps) {
  const summaryItems = resolveSelectionLabels(assessment, categories);

  return (
    <div className="flex flex-col gap-4">
      <span className="inline-flex w-fit rounded-full border border-green-600/50 bg-green-950/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-300">
        Aprovado
      </span>

      {summaryItems.map((item) => (
        <div key={item.categoryName} className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {item.categoryName}
          </span>
          <p className="text-sm text-gray-100">
            {item.labels.length > 0 ? item.labels.join("; ") : "—"}
          </p>
        </div>
      ))}

      {assessment.complement?.trim() ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Complemento da avaliação
          </span>
          <p className="whitespace-pre-wrap text-sm text-gray-100">{assessment.complement}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Aprovado por
          </span>
          <span className="text-sm text-gray-100">{assessment.approvedByName ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Em</span>
          <span className="text-sm text-gray-100">{formatDateTime(assessment.approvedAt)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-400">Aguardando registro da referência IMS</p>
    </div>
  );
}
