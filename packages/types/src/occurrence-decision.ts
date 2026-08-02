/**
 * Tipos de domínio para decisões da liderança (Sprint 2.4 Ver e Agir + 2.5 IO).
 * Referência: docs/decisions/VER-E-AGIR-DECISIONS.md, INTERDICAO-OFICIAL-DECISIONS.md
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

/** Input client-side IO — somente occurrenceId + decisionReason (PO-IO-9). */
export type RecordInterdicaoDecisionInput = {
  occurrenceId: string;
  decisionReason: string;
};

export type RecordOccurrenceDecisionOccurrenceSnapshot = {
  id: string;
  status: OccurrenceStatus;
  decisionType: OccurrenceDecisionType;
  evaluatedAt: string;
};

/** Alias legado 2.4 — mesmo shape de RecordOccurrenceDecisionOccurrenceSnapshot. */
export type RecordVerEAgirDecisionOccurrenceSnapshot = RecordOccurrenceDecisionOccurrenceSnapshot;

export type RecordOccurrenceDecisionResult = {
  decision: OccurrenceDecision;
  occurrence: RecordOccurrenceDecisionOccurrenceSnapshot;
};

/** Alias 2.4 — mesmo envelope RPC `record_occurrence_decision`. */
export type RecordVerEAgirDecisionResult = RecordOccurrenceDecisionResult;

/** Alias 2.5 — mesmo envelope RPC `record_occurrence_decision`. */
export type RecordInterdicaoDecisionResult = RecordOccurrenceDecisionResult;

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

/** Snapshot mínimo para guards UI (PO-IO-10 / VER-E-AGIR PO-4). */
export type OccurrenceDecisionSnapshot = {
  decision: OccurrenceDecision | null;
  decisionType: OccurrenceDecisionType | null;
};

export function hasOccurrenceDecision(snapshot: OccurrenceDecisionSnapshot): boolean {
  if (snapshot.decision !== null) {
    return true;
  }

  return snapshot.decisionType === "VER_E_AGIR" || snapshot.decisionType === "INTERDICAO_OFICIAL";
}

export function isVerEAgirDecisionBranch(
  snapshot: OccurrenceDecisionSnapshot & { status?: OccurrenceStatus },
): boolean {
  if (snapshot.decision?.decisionType === "VER_E_AGIR") {
    return true;
  }

  if (snapshot.decision?.decisionType === "INTERDICAO_OFICIAL") {
    return false;
  }

  if (snapshot.decisionType === "VER_E_AGIR") {
    return true;
  }

  return snapshot.status === "VER_E_AGIR";
}

export function isInterdicaoDecisionBranch(
  snapshot: OccurrenceDecisionSnapshot & { status?: OccurrenceStatus },
): boolean {
  if (snapshot.decision?.decisionType === "INTERDICAO_OFICIAL") {
    return true;
  }

  if (snapshot.decision?.decisionType === "VER_E_AGIR") {
    return false;
  }

  if (snapshot.decisionType === "INTERDICAO_OFICIAL") {
    return true;
  }

  return snapshot.status === "INTERDICAO_CONFIRMADA";
}
