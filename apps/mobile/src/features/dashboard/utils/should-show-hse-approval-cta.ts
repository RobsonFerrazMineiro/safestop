import type { DashboardMetricKey } from "@safestop/types";

type ShouldShowHseApprovalCtaInput = {
  canViewHseQueue: boolean;
  mdhoPendingApproval: number | null | undefined;
  operationalMetricKeys: readonly DashboardMetricKey[];
};

/**
 * CTA Home "Aprovação HSE": só com pendência real e sem duplicar o KPI no grid.
 * Loading / null / erro → oculto (não assume pendência).
 */
export function shouldShowHseApprovalCta({
  canViewHseQueue,
  mdhoPendingApproval,
  operationalMetricKeys,
}: ShouldShowHseApprovalCtaInput): boolean {
  if (!canViewHseQueue) {
    return false;
  }

  if (mdhoPendingApproval == null || mdhoPendingApproval <= 0) {
    return false;
  }

  if (operationalMetricKeys.includes("mdhoPendingApproval")) {
    return false;
  }

  return true;
}
