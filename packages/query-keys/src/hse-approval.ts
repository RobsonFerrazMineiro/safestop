import type { MdhoPendingApprovalCursor } from "@safestop/types";

import { HSE_APPROVAL_SCOPE, TENANT_QUERY_KEY_PREFIX } from "./tenant";

/** Query keys tenant-scoped da fila HSE (PO-CON-7). */
export const hseApprovalQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, HSE_APPROVAL_SCOPE] as const,
  /** Prefixo da fila — invalidar todas as páginas. */
  queue: (organizationId: string) =>
    [...hseApprovalQueryKeys.all(organizationId), "queue"] as const,
  queuePage: (organizationId: string, cursor: MdhoPendingApprovalCursor | null = null) =>
    [
      ...hseApprovalQueryKeys.queue(organizationId),
      cursor?.submittedAt ?? "initial",
      cursor?.assessmentId ?? "initial",
    ] as const,
};
