import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

/** Fila HSE — 30s (HSE-APPROVAL-UI-SPEC § HSE-QUEUE). */
export const HSE_APPROVAL_QUEUE_STALE_TIME_MS = 30_000;

export function hseApprovalQueryKeys(organizationId: string) {
  return {
    queuePrefix: () => [TENANT_QUERY_KEY_PREFIX, organizationId, "hse-approval", "queue"] as const,
    queue: () => [TENANT_QUERY_KEY_PREFIX, organizationId, "hse-approval", "queue"] as const,
  };
}
