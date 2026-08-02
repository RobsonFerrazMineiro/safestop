import {
  isOccurrenceConflictErrorCode,
  isOccurrenceDecisionType,
  isOccurrenceStatus,
  type OccurrenceConflictError,
  type OccurrenceDecision,
  type RecordOccurrenceDecisionResult,
} from "@safestop/types";

import { parseRpcEnvelope } from "./rpc-error";

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

type RpcErrorPayload = {
  code?: string;
  message?: string;
  currentStatus?: string;
  decisionId?: string;
};

function parseConflictError(error: RpcErrorPayload | undefined): OccurrenceConflictError | null {
  if (!error?.code || !isOccurrenceConflictErrorCode(error.code)) {
    return null;
  }

  const currentStatus =
    error.currentStatus && isOccurrenceStatus(error.currentStatus)
      ? error.currentStatus
      : undefined;

  return {
    code: error.code,
    message: error.message ?? "Conflito ao processar a operação.",
    currentStatus,
    decisionId: error.decisionId,
  };
}

export function assertRpcDataOrThrow<T>(data: unknown, fallbackMessage: string): T {
  const envelope = parseRpcEnvelope(data);

  if (envelope.success === false) {
    const conflict = parseConflictError(envelope.error);

    if (conflict) {
      throw new OccurrenceRpcConflictError(conflict);
    }

    if (envelope.error?.code === "VALIDATION_ERROR") {
      throw new OccurrenceRpcValidationError(
        envelope.error.message ?? "Verifique os dados informados e tente novamente.",
      );
    }

    throw new Error(envelope.error?.message ?? fallbackMessage);
  }

  if (envelope.success !== true || !("data" in (envelope as object))) {
    throw new Error(fallbackMessage);
  }

  return (envelope as { success: true; data: T }).data;
}

type RecordDecisionRpcDecision = {
  id: string;
  occurrence_id: string;
  decision_type: string;
  decision_reason: string;
  decided_by: string;
  decided_at: string;
};

type RecordDecisionRpcOccurrence = {
  id: string;
  status: string;
  decision_type: string;
  evaluated_at: string;
};

type RecordDecisionRpcData = {
  decision: RecordDecisionRpcDecision;
  occurrence: RecordDecisionRpcOccurrence;
};

export function mapRecordOccurrenceDecisionResult(
  data: RecordDecisionRpcData,
): RecordOccurrenceDecisionResult {
  const { decision, occurrence } = data;

  if (!isOccurrenceDecisionType(decision.decision_type)) {
    throw new Error("Resposta inválida ao registrar decisão.");
  }

  if (!isOccurrenceStatus(occurrence.status)) {
    throw new Error("Resposta inválida ao registrar decisão.");
  }

  if (!isOccurrenceDecisionType(occurrence.decision_type)) {
    throw new Error("Resposta inválida ao registrar decisão.");
  }

  const mappedDecision: OccurrenceDecision = {
    id: decision.id,
    occurrenceId: decision.occurrence_id,
    decisionType: decision.decision_type,
    decisionReason: decision.decision_reason,
    decidedBy: decision.decided_by,
    decidedByName: null,
    decidedAt: decision.decided_at,
    createdAt: decision.decided_at,
  };

  return {
    decision: mappedDecision,
    occurrence: {
      id: occurrence.id,
      status: occurrence.status,
      decisionType: occurrence.decision_type,
      evaluatedAt: occurrence.evaluated_at,
    },
  };
}
