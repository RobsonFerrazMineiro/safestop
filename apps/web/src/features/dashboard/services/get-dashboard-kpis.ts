import type { DashboardAccessContext, DashboardKpiFilters, DashboardKpis } from "@safestop/types";
import { isDashboardClientFallbackAllowed, toDashboardKpis } from "@safestop/types";

import { getActionItemsAttention } from "./get-action-items-attention";
import { fetchDashboardKpisRpc } from "./fetch-dashboard-kpis-rpc";
import { getFlowMetrics } from "./get-flow-metrics";
import {
  getMdhoPendingApprovalCount,
  getOpenActionPlansCount,
} from "./get-mdho-pending-approval-count";
import { getMyActionItemsSummary } from "./get-my-action-items-summary";
import { getMyAwarenessSummary } from "./get-my-awareness-summary";
import { getOccurrenceKpis } from "./get-occurrence-kpis";
import { getScopedOperationalKpis } from "./get-scoped-operational-kpis";

const FALLBACK_UNAVAILABLE_MESSAGE =
  "Indicadores do dashboard indisponíveis: RPC falhou e o fallback client-side expirou (S32-FIN-M01).";

async function getDashboardKpisClientFallback(
  organizationId: string,
  access: DashboardAccessContext,
  filters: DashboardKpiFilters,
): Promise<DashboardKpis> {
  const [personalActions, personalAwareness, operational, occurrenceKpis, flowMetrics, attention] =
    await Promise.all([
      getMyActionItemsSummary(organizationId, access),
      getMyAwarenessSummary(organizationId, access),
      getScopedOperationalKpis(organizationId, access),
      getOccurrenceKpis(organizationId, access),
      getFlowMetrics(organizationId, access, filters.period),
      getActionItemsAttention(organizationId, access, filters),
    ]);

  const [mdhoPendingApproval, openActionPlans] = await Promise.all([
    getMdhoPendingApprovalCount(organizationId, access),
    getOpenActionPlansCount(organizationId, access),
  ]);

  return {
    personal: {
      myPendingActions: personalActions.myPendingActions,
      myOverdueActions: personalActions.myOverdueActions,
      myPendingAwareness: personalAwareness.myPendingAwareness,
    },
    operational: operational ?? {
      scopedOpenOccurrences: null,
      scopedPendingAwareness: null,
    },
    managerial: {
      activeOccurrences: occurrenceKpis?.activeOccurrences ?? null,
      pendingEvaluation: occurrenceKpis?.pendingEvaluation ?? null,
      activeInterdictions: occurrenceKpis?.activeInterdictions ?? null,
      awaitingValidation: occurrenceKpis?.awaitingValidation ?? null,
      mdhoPendingApproval,
      overdueActionItems: attention.overdueCount,
      dueSoonActionItems: attention.dueSoonCount,
      openActionPlans,
      pendingAwarenessOrg: null,
      newOccurrencesInPeriod: flowMetrics.newOccurrencesInPeriod,
      avgEvaluationTimeMinutes: flowMetrics.avgEvaluationTimeMinutes,
      avgReleaseTimeMinutes: flowMetrics.avgReleaseTimeMinutes,
      actionCompletionRate: flowMetrics.actionCompletionRate,
    },
  };
}

export async function getDashboardKpis(
  organizationId: string,
  access: DashboardAccessContext,
  filters: DashboardKpiFilters = {},
): Promise<DashboardKpis> {
  const rpcPayload = await fetchDashboardKpisRpc(organizationId, filters);

  if (rpcPayload) {
    return toDashboardKpis(rpcPayload);
  }

  if (!isDashboardClientFallbackAllowed()) {
    throw new Error(FALLBACK_UNAVAILABLE_MESSAGE);
  }

  return getDashboardKpisClientFallback(organizationId, access, filters);
}
