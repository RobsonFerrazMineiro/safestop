import type { MdhoSelectionInput } from "@safestop/types";
import type { MdhoAssessmentEnriched } from "../services/map-mdho";

export type MdhoFormState = {
  selections: MdhoSelectionInput[];
  complement: string;
};

export function buildFormStateFromAssessment(
  assessment: MdhoAssessmentEnriched | null,
): MdhoFormState {
  if (!assessment) {
    return { selections: [], complement: "" };
  }

  return {
    selections:
      assessment.selections?.map((selection) => ({
        categoryId: selection.categoryId,
        optionId: selection.optionId,
        detail: selection.detail ?? undefined,
      })) ?? [],
    complement: assessment.complement ?? "",
  };
}

export function toggleCheckboxSelection(
  state: MdhoFormState,
  categoryId: string,
  optionId: string,
): MdhoFormState {
  const exists = state.selections.some(
    (selection) => selection.categoryId === categoryId && selection.optionId === optionId,
  );

  if (exists) {
    return {
      ...state,
      selections: state.selections.filter(
        (selection) => !(selection.categoryId === categoryId && selection.optionId === optionId),
      ),
    };
  }

  return {
    ...state,
    selections: [...state.selections, { categoryId, optionId }],
  };
}

export function setRadioSelection(
  state: MdhoFormState,
  categoryId: string,
  optionId: string,
): MdhoFormState {
  return {
    ...state,
    selections: [
      ...state.selections.filter((selection) => selection.categoryId !== categoryId),
      { categoryId, optionId },
    ],
  };
}

export function setSelectionDetail(
  state: MdhoFormState,
  categoryId: string,
  optionId: string,
  detail: string,
): MdhoFormState {
  return {
    ...state,
    selections: state.selections.map((selection) =>
      selection.categoryId === categoryId && selection.optionId === optionId
        ? { ...selection, detail }
        : selection,
    ),
  };
}

export function isOptionSelected(
  state: MdhoFormState,
  categoryId: string,
  optionId: string,
): boolean {
  return state.selections.some(
    (selection) => selection.categoryId === categoryId && selection.optionId === optionId,
  );
}

export function getSelectionDetail(
  state: MdhoFormState,
  categoryId: string,
  optionId: string,
): string {
  const selection = state.selections.find(
    (item) => item.categoryId === categoryId && item.optionId === optionId,
  );

  return selection?.detail ?? "";
}
