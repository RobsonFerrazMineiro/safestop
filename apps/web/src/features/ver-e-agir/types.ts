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
