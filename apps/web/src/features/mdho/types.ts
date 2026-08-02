import type {
  MdhoAssessment,
  MdhoCatalogCategory,
  OccurrenceDecisionType,
  OccurrenceStatus,
} from "@safestop/types";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";

/** Cache MDHO assessment — 30s (MDHO-DECISIONS § Cache). */
export const MDHO_ASSESSMENT_STALE_TIME_MS = 30_000;

/** Catálogo MDHO — 5min (global + tenant). */
export const MDHO_CATALOG_STALE_TIME_MS = 5 * 60 * 1000;

export type MdhoOccurrence = Pick<OccurrenceDetailsEnriched, "id" | "status" | "decisionType">;

export type MdhoAssessmentEnriched = MdhoAssessment & {
  submittedByName: string | null;
  approvedByName: string | null;
  returnedByName: string | null;
};

export type MdhoFormSelectionState = {
  optionId: string;
  detail: string;
};

export type MdhoContext = {
  canStartMdho: boolean;
  canEditMdho: boolean;
  canSubmitMdho: boolean;
  canApproveMdho: boolean;
  canReturnMdho: boolean;
  canViewMdho: boolean;
  shouldRenderSection: boolean;
  isOffline: boolean;
};

export type MdhoCategoryStep = MdhoCatalogCategory;

export function shouldShowMdhoSection(occurrence: {
  decisionType: OccurrenceDecisionType | null;
  status: OccurrenceStatus;
}): boolean {
  if (occurrence.decisionType !== "INTERDICAO_OFICIAL") {
    return false;
  }

  return (
    occurrence.status === "INTERDICAO_CONFIRMADA" ||
    occurrence.status === "MDHO_EM_PREENCHIMENTO" ||
    occurrence.status === "AGUARDANDO_APROVACAO_HSE" ||
    occurrence.status === "AGUARDANDO_REGISTRO_IMS"
  );
}
