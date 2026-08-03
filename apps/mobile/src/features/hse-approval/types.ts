import type { MdhoPendingApprovalCursor } from "@safestop/types";

/** Fila HSE — 30s (HSE-APPROVAL-UI-SPEC § HSE-QUEUE). */
export const HSE_APPROVAL_QUEUE_STALE_TIME_MS = 30_000;

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

export type { MdhoPendingApprovalCursor };
