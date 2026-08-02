import type { OccurrenceDecision, OccurrenceStatus } from "@safestop/types";

import { hasOccurrenceDecision } from "@/features/ver-e-agir/utils/has-occurrence-decision";

export function canConfirmInterdiction(params: {
  canConfirm: boolean;
  isPlatformAdmin: boolean;
  status: OccurrenceStatus;
  occurrence: {
    decision: OccurrenceDecision | null;
    decisionType: OccurrenceDecision["decisionType"] | null;
  };
}): boolean {
  return (
    params.canConfirm &&
    !params.isPlatformAdmin &&
    params.status === "EM_AVALIACAO" &&
    !hasOccurrenceDecision(params.occurrence)
  );
}

export function shouldShowInterdicaoSummary(
  status: OccurrenceStatus,
  decision: OccurrenceDecision | null,
): boolean {
  if (decision?.decisionType === "INTERDICAO_OFICIAL") {
    return true;
  }

  return status === "INTERDICAO_CONFIRMADA" && decision !== null;
}

export function shouldShowInterdicaoBanner(status: OccurrenceStatus): boolean {
  return status === "INTERDICAO_CONFIRMADA";
}
