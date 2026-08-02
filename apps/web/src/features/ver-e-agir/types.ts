import type { OccurrenceConflictError, OccurrenceStatus } from "@safestop/types";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";

export type VerEAgirContext = {
  canStartEvaluation: boolean;
  canRecordVerEAgir: boolean;
  canViewEvaluationContext: boolean;
  showPendingEvaluation: boolean;
  showEvaluationForm: boolean;
  showSummary: boolean;
  shouldRenderSection: boolean;
  hasDecision: boolean;
  isOffline: boolean;
};

export type VerEAgirOccurrence = Pick<
  OccurrenceDetailsEnriched,
  | "id"
  | "status"
  | "conditionDescription"
  | "immediateActionDescription"
  | "assignedEvaluatorId"
  | "assignedEvaluatorName"
  | "decision"
  | "decisionType"
>;

export class OccurrenceRpcConflictError extends Error {
  readonly conflict: OccurrenceConflictError;

  constructor(conflict: OccurrenceConflictError) {
    super(conflict.message);
    this.name = "OccurrenceRpcConflictError";
    this.conflict = conflict;
  }
}

export class OccurrenceRpcValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OccurrenceRpcValidationError";
  }
}

export function isOccurrenceRpcConflictError(error: unknown): error is OccurrenceRpcConflictError {
  return error instanceof OccurrenceRpcConflictError;
}

export function isOccurrenceRpcValidationError(
  error: unknown,
): error is OccurrenceRpcValidationError {
  return error instanceof OccurrenceRpcValidationError;
}

export function hasVerEAgirDecision(occurrence: VerEAgirOccurrence): boolean {
  return occurrence.decision !== null || occurrence.decisionType === "VER_E_AGIR";
}

export function shouldShowVerEAgirSummary(
  status: OccurrenceStatus,
  occurrence: VerEAgirOccurrence,
): boolean {
  if (hasVerEAgirDecision(occurrence)) {
    return true;
  }

  return status === "VER_E_AGIR";
}
