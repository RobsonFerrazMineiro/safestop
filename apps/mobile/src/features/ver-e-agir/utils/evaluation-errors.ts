import {
  isOccurrenceConflictErrorCode,
  isOccurrenceStatus,
  type OccurrenceConflictError,
  type OccurrenceStatus,
} from "@safestop/types";

type RpcErrorPayload = {
  code?: string;
  message?: string;
  currentStatus?: string;
  decisionId?: string;
};

type RpcEnvelope = {
  success: boolean;
  error?: RpcErrorPayload;
};

export class EvaluationMutationError extends Error {
  readonly code: string;
  readonly currentStatus?: OccurrenceStatus;
  readonly decisionId?: string;

  constructor(payload: RpcErrorPayload, fallbackMessage: string) {
    super(payload.message ?? fallbackMessage);
    this.name = "EvaluationMutationError";
    this.code = payload.code ?? "UNKNOWN";
    this.currentStatus =
      payload.currentStatus && isOccurrenceStatus(payload.currentStatus)
        ? payload.currentStatus
        : undefined;
    this.decisionId = payload.decisionId;
  }

  toConflictError(): OccurrenceConflictError | null {
    if (!isOccurrenceConflictErrorCode(this.code)) {
      return null;
    }

    return {
      code: this.code,
      message: this.message,
      currentStatus: this.currentStatus,
      decisionId: this.decisionId,
    };
  }

  isConflict(): boolean {
    return isOccurrenceConflictErrorCode(this.code);
  }
}

export function parseEvaluationRpcError(
  data: unknown,
  fallbackMessage: string,
): EvaluationMutationError {
  const response = data as RpcEnvelope;
  const error = response?.error ?? {};

  return new EvaluationMutationError(error, fallbackMessage);
}
