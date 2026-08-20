/**
 * Parsing de erros RPC — Notificações (Sprint 3.1).
 * Reaproveita envelope compartilhado; espelha action-plan-rpc / mdho-rpc.
 */

import { isNotificationDomainErrorCode, type NotificationError } from "./notification";
import { parseRpcEnvelope } from "./rpc-envelope";

export class NotificationRpcConflictError extends Error {
  readonly conflict: NotificationError;

  constructor(conflict: NotificationError) {
    super(conflict.message);
    this.name = "NotificationRpcConflictError";
    this.conflict = conflict;
  }
}

export class NotificationRpcValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationRpcValidationError";
  }
}

export function isNotificationRpcConflictError(
  error: unknown,
): error is NotificationRpcConflictError {
  return error instanceof NotificationRpcConflictError;
}

export function isNotificationRpcValidationError(
  error: unknown,
): error is NotificationRpcValidationError {
  return error instanceof NotificationRpcValidationError;
}

type RpcErrorPayload = {
  code?: string;
  message?: string;
};

function parseNotificationDomainError(
  error: RpcErrorPayload | undefined,
): NotificationError | null {
  if (!error?.code || !isNotificationDomainErrorCode(error.code)) {
    return null;
  }

  return {
    code: error.code,
    message: error.message ?? "Não foi possível processar a notificação.",
  };
}

export function assertNotificationRpcDataOrThrow<T>(data: unknown, fallbackMessage: string): T {
  const envelope = parseRpcEnvelope(data);

  if (envelope.success === false) {
    const conflict = parseNotificationDomainError((envelope as { error?: RpcErrorPayload }).error);

    if (conflict) {
      if (conflict.code === "VALIDATION_ERROR") {
        throw new NotificationRpcValidationError(conflict.message);
      }

      throw new NotificationRpcConflictError(conflict);
    }

    throw new Error(envelope.error?.message ?? fallbackMessage);
  }

  if (envelope.success !== true || !("data" in (envelope as object))) {
    throw new Error(fallbackMessage);
  }

  return (envelope as { success: true; data: T }).data;
}

export function assertListMyNotificationsResult(
  data: unknown,
  fallbackMessage: string,
): { items: unknown[]; nextCursor: string | null } {
  if (typeof data !== "object" || data === null) {
    throw new Error(fallbackMessage);
  }

  const envelope = data as {
    success?: boolean;
    error?: RpcErrorPayload;
    items?: unknown;
    nextCursor?: string | null;
  };

  if (envelope.success === false) {
    const conflict = parseNotificationDomainError(envelope.error);

    if (conflict?.code === "VALIDATION_ERROR") {
      throw new NotificationRpcValidationError(conflict.message);
    }

    if (conflict) {
      throw new NotificationRpcConflictError(conflict);
    }

    throw new Error(envelope.error?.message ?? fallbackMessage);
  }

  if (envelope.success !== true || !Array.isArray(envelope.items)) {
    throw new Error(fallbackMessage);
  }

  return {
    items: envelope.items,
    nextCursor: envelope.nextCursor ?? null,
  };
}

export { assertRpcSuccess } from "./rpc-envelope";
