import type { OccurrenceDecision, OccurrenceStatus } from "@safestop/types";

export function canStartEvaluation(params: {
  canEvaluate: boolean;
  isPlatformAdmin: boolean;
  status: OccurrenceStatus;
}): boolean {
  return (
    params.canEvaluate && !params.isPlatformAdmin && params.status === "PARALISACAO_PREVENTIVA"
  );
}

export function canRecordVerEAgir(params: {
  canEvaluate: boolean;
  isPlatformAdmin: boolean;
  status: OccurrenceStatus;
  hasDecision: boolean;
}): boolean {
  return (
    params.canEvaluate &&
    !params.isPlatformAdmin &&
    params.status === "EM_AVALIACAO" &&
    !params.hasDecision
  );
}

export function shouldShowVerEAgirSummary(
  status: OccurrenceStatus,
  decision: OccurrenceDecision | null,
): boolean {
  if (decision?.decisionType === "VER_E_AGIR") {
    return true;
  }

  return status === "VER_E_AGIR" && decision !== null;
}

export function canViewEvaluationContext(canRead: boolean): boolean {
  return canRead;
}
