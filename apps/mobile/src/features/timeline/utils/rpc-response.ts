type RpcEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

export function assertRpcSuccess<T>(data: unknown, fallbackMessage: string): T {
  const response = data as RpcEnvelope<T>;

  if (!response?.success || response.data === undefined) {
    throw new Error(response?.error?.message ?? fallbackMessage);
  }

  return response.data;
}
