import type { ActionItemAttachmentUploadStatus, ActionItemPriority } from "@safestop/types";

import { ACTION_PLAN_COPY } from "./action-plan-copy";

/** Evidência obrigatória apenas em Alta/Crítica (PO-AP-16). MEDIUM/LOW opcional. */
export function requiresActionItemEvidence(priority: ActionItemPriority): boolean {
  return priority === "HIGH" || priority === "CRITICAL";
}

export function countCompletedActionItemAttachments(
  attachments: readonly { uploadStatus: ActionItemAttachmentUploadStatus | string }[],
): number {
  return attachments.filter((attachment) => attachment.uploadStatus === "COMPLETED").length;
}

export function formatEvidenceCounter(completedCount: number, max: number): string {
  return `${completedCount}/${max} evidências`;
}

/** Espelha a validação de evidência do ActionPlanSubmitSheet.handleSend. */
export function getActionItemEvidenceSubmitError(
  priority: ActionItemPriority,
  completedCount: number,
): string | null {
  if (requiresActionItemEvidence(priority) && completedCount < 1) {
    return ACTION_PLAN_COPY.evidenceRequiredError;
  }

  return null;
}

/**
 * Após upload COMPLETED: distingue lista vazia legítima de falha de refetch.
 * Não dispara reupload — apenas sinaliza erro de atualização da lista.
 */
export function getAttachmentListRefreshError(refetchResult: {
  error: Error | null;
}): string | null {
  if (refetchResult.error) {
    return ACTION_PLAN_COPY.evidenceListRefreshError;
  }

  return null;
}
