import {
  isImsReferenceErrorCode,
  type ImsReferenceErrorCode,
  type OccurrenceStatus,
  isOccurrenceStatus,
} from "@safestop/types";

type RpcErrorPayload = {
  code?: string;
  message?: string;
  currentStatus?: string;
  imsReferenceCode?: string;
};

type RpcEnvelope = {
  success: boolean;
  error?: RpcErrorPayload;
};

export class ImsReferenceMutationError extends Error {
  readonly code: string;
  readonly currentStatus?: OccurrenceStatus;
  readonly imsReferenceCode?: string;

  constructor(payload: RpcErrorPayload, fallbackMessage: string) {
    super(payload.message ?? fallbackMessage);
    this.name = "ImsReferenceMutationError";
    this.code = payload.code ?? "UNKNOWN";
    this.currentStatus =
      payload.currentStatus && isOccurrenceStatus(payload.currentStatus)
        ? payload.currentStatus
        : undefined;
    this.imsReferenceCode = payload.imsReferenceCode;
  }

  isConflict(): boolean {
    return isImsReferenceErrorCode(this.code as ImsReferenceErrorCode);
  }
}

export function parseImsReferenceRpcError(
  data: unknown,
  fallbackMessage: string,
): ImsReferenceMutationError {
  const response = data as RpcEnvelope;
  return new ImsReferenceMutationError(response?.error ?? {}, fallbackMessage);
}
