/**
 * Helpers RPC — envelope jsonb `{ success, data?, error?, items?, nextCursor? }`.
 * Padrão compartilhado (espelha apps/web/features/occurrences/utils/rpc-error.ts).
 */

export type RpcErrorPayload = {
  code?: string;
  message?: string;
};

export type RpcEnvelope = {
  success?: boolean;
  error?: RpcErrorPayload;
};

const INTERNAL_ERROR_MESSAGE = "Não foi possível concluir a operação. Tente novamente mais tarde.";

const RPC_SAFE_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
  FORBIDDEN: "Você não possui permissão para esta operação.",
  VALIDATION_ERROR: "Verifique os dados informados e tente novamente.",
  NOT_FOUND: "Registro não encontrado.",
  INTERNAL_ERROR: INTERNAL_ERROR_MESSAGE,
};

export function parseRpcEnvelope(data: unknown): RpcEnvelope {
  if (typeof data === "object" && data !== null) {
    return data as RpcEnvelope;
  }

  return {};
}

export function getRpcErrorMessage(error: RpcErrorPayload | undefined): string {
  if (!error?.code) {
    return INTERNAL_ERROR_MESSAGE;
  }

  return RPC_SAFE_MESSAGES[error.code] ?? INTERNAL_ERROR_MESSAGE;
}

export function assertRpcSuccess<T>(data: unknown, fallbackMessage: string): T {
  const envelope = parseRpcEnvelope(data);

  if (envelope.success === false) {
    throw new Error(getRpcErrorMessage(envelope.error));
  }

  if (envelope.success !== true || !("data" in (envelope as object))) {
    throw new Error(fallbackMessage);
  }

  return (envelope as { success: true; data: T }).data;
}
