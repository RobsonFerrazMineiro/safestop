/**
 * Tipos de domínio para Ver e Agir / decisão de avaliação (Sprint 2.4).
 * Referência: docs/decisions/VER-E-AGIR-DECISIONS.md; docs/database.md §10.1
 */

import type { OccurrenceDecisionType, OccurrenceStatus } from "./occurrence-status";

/** PO-6 — justificativa formal da decisão Ver e Agir. */
export const OCCURRENCE_DECISION_REASON_MIN_LENGTH = 10;

export const OCCURRENCE_DECISION_REASON_MAX_LENGTH = 4000;

/**
 * Decisão vigente 1:1 (docs/database.md §10.1; VER-E-AGIR PO-4 a PO-12).
 */
export type OccurrenceDecision = {
  id: string;
  occurrenceId: string;
  decisionType: OccurrenceDecisionType;
  decisionReason: string;
  decidedBy: string;
  decidedByName: string | null;
  decidedAt: string;
  createdAt: string;
};

/**
 * Resultado de transição start_occurrence_evaluation (PO-17 idempotência).
 */
export type OccurrenceTransitionResult = {
  occurrenceId: string;
  previousStatus: OccurrenceStatus;
  currentStatus: OccurrenceStatus;
  assignedEvaluatorId: string;
  transitionedAt: string;
};

export type StartEvaluationResult = {
  data: OccurrenceTransitionResult;
};

export type RecordVerEAgirDecisionInput = {
  occurrenceId: string;
  decisionReason: string;
};

export type RecordVerEAgirDecisionOccurrenceSnapshot = {
  id: string;
  status: OccurrenceStatus;
  decisionType: OccurrenceDecisionType;
  evaluatedAt: string;
};

export type RecordVerEAgirDecisionResult = {
  decision: OccurrenceDecision;
  occurrence: RecordVerEAgirDecisionOccurrenceSnapshot;
};

/** Códigos de conflito tratáveis na UI (VER-E-AGIR-DECISIONS § RPCs). */
export const OCCURRENCE_CONFLICT_ERROR_CODES = [
  "STATUS_MISMATCH",
  "ALREADY_DECIDED",
  "CONFLICT",
] as const;

export type OccurrenceConflictErrorCode = (typeof OCCURRENCE_CONFLICT_ERROR_CODES)[number];

export type OccurrenceConflictError = {
  code: OccurrenceConflictErrorCode;
  message: string;
  currentStatus?: OccurrenceStatus;
  decisionId?: string;
};

export function isOccurrenceConflictErrorCode(value: string): value is OccurrenceConflictErrorCode {
  return (OCCURRENCE_CONFLICT_ERROR_CODES as readonly string[]).includes(value);
}
