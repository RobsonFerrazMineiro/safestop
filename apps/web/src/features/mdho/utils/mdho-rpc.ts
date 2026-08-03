import {
  isMdhoAssessmentStatus,
  isMdhoConflictErrorCode,
  isOccurrenceStatus,
  type MdhoConflictError,
} from "@safestop/types";

import { parseRpcEnvelope } from "@/features/occurrences/utils/rpc-error";

export class MdhoRpcConflictError extends Error {
  readonly conflict: MdhoConflictError;

  constructor(conflict: MdhoConflictError) {
    super(conflict.message);
    this.name = "MdhoRpcConflictError";
    this.conflict = conflict;
  }
}

export class MdhoRpcValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MdhoRpcValidationError";
  }
}

export class MdhoRpcSelfApprovalError extends Error {
  constructor(message = "Quem enviou o MDHO não pode aprová-lo.") {
    super(message);
    this.name = "MdhoRpcSelfApprovalError";
  }
}

export function isMdhoRpcSelfApprovalError(error: unknown): error is MdhoRpcSelfApprovalError {
  return error instanceof MdhoRpcSelfApprovalError;
}

export function isMdhoRpcConflictError(error: unknown): error is MdhoRpcConflictError {
  return error instanceof MdhoRpcConflictError;
}

export function isMdhoRpcValidationError(error: unknown): error is MdhoRpcValidationError {
  return error instanceof MdhoRpcValidationError;
}

type RpcErrorPayload = {
  code?: string;
  message?: string;
  currentStatus?: string;
  assessmentId?: string;
};

function parseMdhoConflictError(error: RpcErrorPayload | undefined): MdhoConflictError | null {
  if (!error?.code || !isMdhoConflictErrorCode(error.code)) {
    return null;
  }

  const currentStatus =
    error.currentStatus &&
    (isMdhoAssessmentStatus(error.currentStatus) || isOccurrenceStatus(error.currentStatus))
      ? error.currentStatus
      : undefined;

  return {
    code: error.code,
    message: error.message ?? "Conflito ao processar a operação MDHO.",
    currentStatus,
    assessmentId: error.assessmentId,
  };
}

export function assertMdhoRpcDataOrThrow<T>(data: unknown, fallbackMessage: string): T {
  const envelope = parseRpcEnvelope(data);

  if (envelope.success === false) {
    const conflict = parseMdhoConflictError(envelope.error);

    if (conflict) {
      throw new MdhoRpcConflictError(conflict);
    }

    if (envelope.error?.code === "VALIDATION_ERROR") {
      throw new MdhoRpcValidationError(
        envelope.error.message ?? "Verifique os dados informados e tente novamente.",
      );
    }

    if (envelope.error?.code === "SELF_APPROVAL_FORBIDDEN") {
      throw new MdhoRpcSelfApprovalError(envelope.error.message);
    }

    throw new Error(envelope.error?.message ?? fallbackMessage);
  }

  if (envelope.success !== true || !("data" in (envelope as object))) {
    throw new Error(fallbackMessage);
  }

  return (envelope as { success: true; data: T }).data;
}
