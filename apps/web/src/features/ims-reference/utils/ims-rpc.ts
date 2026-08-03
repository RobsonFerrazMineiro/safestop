import {
  isImsReferenceErrorCode,
  isOccurrenceStatus,
  type ImsReferenceError,
} from "@safestop/types";

import { parseRpcEnvelope } from "@/features/occurrences/utils/rpc-error";

export class ImsReferenceRpcConflictError extends Error {
  readonly conflict: ImsReferenceError;

  constructor(conflict: ImsReferenceError) {
    super(conflict.message);
    this.name = "ImsReferenceRpcConflictError";
    this.conflict = conflict;
  }
}

export class ImsReferenceRpcValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImsReferenceRpcValidationError";
  }
}

export function isImsReferenceRpcConflictError(
  error: unknown,
): error is ImsReferenceRpcConflictError {
  return error instanceof ImsReferenceRpcConflictError;
}

export function isImsReferenceRpcValidationError(
  error: unknown,
): error is ImsReferenceRpcValidationError {
  return error instanceof ImsReferenceRpcValidationError;
}

type RpcErrorPayload = {
  code?: string;
  message?: string;
  currentStatus?: string;
  imsReferenceCode?: string;
};

function parseImsReferenceConflictError(
  error: RpcErrorPayload | undefined,
): ImsReferenceError | null {
  if (!error?.code || !isImsReferenceErrorCode(error.code)) {
    return null;
  }

  const currentStatus =
    error.currentStatus && isOccurrenceStatus(error.currentStatus)
      ? error.currentStatus
      : undefined;

  return {
    code: error.code,
    message: error.message ?? "Conflito ao processar referência IMS.",
    currentStatus,
    imsReferenceCode: error.imsReferenceCode,
  };
}

export function assertImsReferenceRpcDataOrThrow<T>(data: unknown, fallbackMessage: string): T {
  const envelope = parseRpcEnvelope(data);

  if (envelope.success === false) {
    const conflict = parseImsReferenceConflictError(
      (envelope as { error?: RpcErrorPayload }).error,
    );

    if (conflict) {
      throw new ImsReferenceRpcConflictError(conflict);
    }

    if (envelope.error?.code === "VALIDATION_ERROR") {
      throw new ImsReferenceRpcValidationError(
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
