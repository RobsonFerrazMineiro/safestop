type RpcErrorPayload = {
  code?: string;
  message?: string;
};

type RpcEnvelope = {
  success?: boolean;
  error?: RpcErrorPayload;
};

const SAFE_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
  FORBIDDEN: "Você não possui permissão para esta operação.",
  VALIDATION_ERROR: "Verifique os dados informados e tente novamente.",
  INTERNAL_ERROR: "Não foi possível concluir a operação. Tente novamente mais tarde.",
};

export function parseRpcEnvelope(data: unknown): RpcEnvelope {
  if (typeof data === "object" && data !== null) {
    return data as RpcEnvelope;
  }

  return {};
}

export function getRpcErrorMessage(error: RpcErrorPayload | undefined): string {
  if (!error?.code) {
    return "Não foi possível concluir a operação. Tente novamente mais tarde.";
  }

  return (
    SAFE_MESSAGES[error.code] ?? "Não foi possível concluir a operação. Tente novamente mais tarde."
  );
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
