import type { MdhoCatalogCategory } from "@safestop/types";

import type { MdhoAssessmentEnriched } from "../types";

export function formatMdhoDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export type MdhoReadOnlyCategoryItem = {
  categoryName: string;
  labels: string[];
};

export function resolveMdhoSelectionLabels(
  assessment: MdhoAssessmentEnriched,
  categories: MdhoCatalogCategory[],
): MdhoReadOnlyCategoryItem[] {
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
