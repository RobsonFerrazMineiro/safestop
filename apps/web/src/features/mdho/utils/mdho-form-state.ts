import {
  MDHO_OTHER_OPTION_CODE,
  type MdhoCatalogCategory,
  type MdhoSelection,
  type MdhoSelectionInput,
} from "@safestop/types";

import type { MdhoFormSelectionState } from "../types";

export function buildFormStateFromSelections(
  catalog: MdhoCatalogCategory[],
  selections: MdhoSelection[] | undefined,
): Record<string, MdhoFormSelectionState[]> {
  const state: Record<string, MdhoFormSelectionState[]> = {};

  for (const category of catalog) {
    state[category.id] = [];
  }

  for (const selection of selections ?? []) {
    const bucket = state[selection.categoryId];

    if (!bucket) {
      continue;
    }

    bucket.push({
      optionId: selection.optionId,
      detail: selection.detail ?? "",
    });
  }

  return state;
}

export function formStateToSelectionInputs(
  formState: Record<string, MdhoFormSelectionState[]>,
): MdhoSelectionInput[] {
  const inputs: MdhoSelectionInput[] = [];

  for (const entries of Object.values(formState)) {
    for (const entry of entries) {
      const detail = entry.detail.trim();
      inputs.push({
        categoryId: findCategoryIdForOption(formState, entry.optionId) ?? "",
        optionId: entry.optionId,
        detail: detail.length > 0 ? detail : undefined,
      });
    }
  }

  return inputs.filter((item) => item.categoryId.length > 0);
}

function findCategoryIdForOption(
  formState: Record<string, MdhoFormSelectionState[]>,
  optionId: string,
): string | null {
  for (const [categoryId, entries] of Object.entries(formState)) {
    if (entries.some((entry) => entry.optionId === optionId)) {
      return categoryId;
    }
  }

  return null;
}

export function selectionInputsFromFormState(
  catalog: MdhoCatalogCategory[],
  formState: Record<string, MdhoFormSelectionState[]>,
): MdhoSelectionInput[] {
  const inputs: MdhoSelectionInput[] = [];

  for (const category of catalog) {
    for (const entry of formState[category.id] ?? []) {
      const detail = entry.detail.trim();
      inputs.push({
        categoryId: category.id,
        optionId: entry.optionId,
        detail: detail.length > 0 ? detail : undefined,
      });
    }
  }

  return inputs;
}

export function isOtherOptionSelected(
  category: MdhoCatalogCategory,
  formState: Record<string, MdhoFormSelectionState[]>,
): boolean {
  const otherOption = category.options.find((option) => option.code === MDHO_OTHER_OPTION_CODE);
  if (!otherOption) {
    return false;
  }

  return (formState[category.id] ?? []).some((entry) => entry.optionId === otherOption.id);
}

export function getOtherDetail(
  category: MdhoCatalogCategory,
  formState: Record<string, MdhoFormSelectionState[]>,
): string {
  const otherOption = category.options.find((option) => option.code === MDHO_OTHER_OPTION_CODE);
  if (!otherOption) {
    return "";
  }

  return (
    (formState[category.id] ?? []).find((entry) => entry.optionId === otherOption.id)?.detail ?? ""
  );
}
