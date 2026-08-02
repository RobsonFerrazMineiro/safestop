import {
  isMdhoConflictErrorCode,
  isMdhoAssessmentStatus,
  isOccurrenceStatus,
  type MdhoConflictError,
  type MdhoAssessmentStatus,
  type OccurrenceStatus,
} from "@safestop/types";

type RpcErrorPayload = {
  code?: string;
  message?: string;
  currentStatus?: string;
  assessmentId?: string;
};

type RpcEnvelope = {
  success: boolean;
  error?: RpcErrorPayload;
};

export class MdhoMutationError extends Error {
  readonly code: string;
  readonly currentStatus?: MdhoAssessmentStatus | OccurrenceStatus;
  readonly assessmentId?: string;

  constructor(payload: RpcErrorPayload, fallbackMessage: string) {
    super(payload.message ?? fallbackMessage);
    this.name = "MdhoMutationError";
    this.code = payload.code ?? "UNKNOWN";
    this.currentStatus =
      payload.currentStatus &&
      (isMdhoAssessmentStatus(payload.currentStatus) || isOccurrenceStatus(payload.currentStatus))
        ? payload.currentStatus
        : undefined;
    this.assessmentId = payload.assessmentId;
  }

  toConflictError(): MdhoConflictError | null {
    if (!isMdhoConflictErrorCode(this.code)) {
      return null;
    }

    return {
      code: this.code,
      message: this.message,
      currentStatus: this.currentStatus,
      assessmentId: this.assessmentId,
    };
  }

  isConflict(): boolean {
    return isMdhoConflictErrorCode(this.code);
  }
}

export function parseMdhoRpcError(data: unknown, fallbackMessage: string): MdhoMutationError {
  const response = data as RpcEnvelope;
  return new MdhoMutationError(response?.error ?? {}, fallbackMessage);
}
