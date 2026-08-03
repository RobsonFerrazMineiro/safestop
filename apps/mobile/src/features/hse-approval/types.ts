import type { MdhoPendingApprovalCursor } from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

export const HSE_APPROVAL_SCOPE = "hse-approval" as const;

export const HSE_APPROVAL_QUEUE_STALE_TIME_MS = 30_000;

export const hseApprovalQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, HSE_APPROVAL_SCOPE] as const,
  queue: (organizationId: string) =>
    [...hseApprovalQueryKeys.all(organizationId), "queue"] as const,
  queuePage: (organizationId: string, cursor: MdhoPendingApprovalCursor | null = null) =>
    [
      ...hseApprovalQueryKeys.queue(organizationId),
      cursor?.submittedAt ?? "initial",
      cursor?.assessmentId ?? "initial",
    ] as const,
};

export type HseActionsFooterState = {
  visible: boolean;
  canApprove: boolean;
  canReturn: boolean;
  isOnline: boolean;
  isApproving: boolean;
  isReturning: boolean;
  onApprove: () => void;
  onReturn: (returnReason: string) => Promise<void>;
};
