import {
  isActionPlanDomainErrorCode,
  isActionPlanStatus,
  isActionItemStatus,
  type ActionPlanError,
} from "@safestop/types";

import { parseRpcEnvelope } from "@/features/occurrences/utils/rpc-error";

export class ActionPlanRpcConflictError extends Error {
  readonly conflict: ActionPlanError;

  constructor(conflict: ActionPlanError) {
    super(conflict.message);
    this.name = "ActionPlanRpcConflictError";
    this.conflict = conflict;
  }
}

export class ActionPlanRpcValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionPlanRpcValidationError";
  }
}

export class ActionPlanRpcSelfValidationError extends Error {
  constructor(message = "Quem concluiu a ação não pode validá-la.") {
    super(message);
    this.name = "ActionPlanRpcSelfValidationError";
  }
}

export function isActionPlanRpcConflictError(error: unknown): error is ActionPlanRpcConflictError {
  return error instanceof ActionPlanRpcConflictError;
}

export function isActionPlanRpcValidationError(
  error: unknown,
): error is ActionPlanRpcValidationError {
  return error instanceof ActionPlanRpcValidationError;
}

export function isActionPlanRpcSelfValidationError(
  error: unknown,
): error is ActionPlanRpcSelfValidationError {
  return error instanceof ActionPlanRpcSelfValidationError;
}

type RpcErrorPayload = {
  code?: string;
  message?: string;
  currentStatus?: string;
};

function parseActionPlanConflictError(error: RpcErrorPayload | undefined): ActionPlanError | null {
  if (!error?.code || !isActionPlanDomainErrorCode(error.code)) {
    return null;
  }

  if (error.code === "SELF_VALIDATION_FORBIDDEN") {
    return null;
  }

  const currentStatus =
    error.currentStatus &&
    (isActionPlanStatus(error.currentStatus) || isActionItemStatus(error.currentStatus))
      ? error.currentStatus
      : undefined;

  return {
    code: error.code,
    message: error.message ?? "Conflito ao processar o Plano de Ação.",
    currentStatus,
  };
}

export function assertActionPlanRpcDataOrThrow<T>(data: unknown, fallbackMessage: string): T {
  const envelope = parseRpcEnvelope(data);

  if (envelope.success === false) {
    const conflict = parseActionPlanConflictError((envelope as { error?: RpcErrorPayload }).error);

    if (conflict) {
      throw new ActionPlanRpcConflictError(conflict);
    }

    if (envelope.error?.code === "VALIDATION_ERROR") {
      throw new ActionPlanRpcValidationError(
        envelope.error.message ?? "Verifique os dados informados e tente novamente.",
      );
    }

    if (envelope.error?.code === "SELF_VALIDATION_FORBIDDEN") {
      throw new ActionPlanRpcSelfValidationError(envelope.error.message);
    }

    throw new Error(envelope.error?.message ?? fallbackMessage);
  }

  if (envelope.success !== true || !("data" in (envelope as object))) {
    throw new Error(fallbackMessage);
  }

  return (envelope as { success: true; data: T }).data;
}
