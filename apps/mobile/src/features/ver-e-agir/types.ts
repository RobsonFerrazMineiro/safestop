export type {
  OccurrenceConflictError,
  OccurrenceConflictErrorCode,
  OccurrenceDecision,
  OccurrenceTransitionResult,
  RecordVerEAgirDecisionResult,
  StartEvaluationResult,
} from "@safestop/types";

export type EvaluationConflictState = {
  code: "STATUS_MISMATCH" | "ALREADY_DECIDED" | "CONFLICT";
  message: string;
};
