import type { DashboardAccessContext, DashboardKpis } from "@safestop/types";
import { isDashboardClientFallbackAllowed, toDashboardKpis } from "@safestop/types";

import { fetchDashboardKpisRpc } from "./fetch-dashboard-kpis-rpc";
import { getActiveOccurrencesCount } from "./get-active-occurrences-count";
import { getMyActionItemsSummary } from "./get-my-action-items-summary";
import { getMyAwarenessSummary } from "./get-my-awareness-summary";
import { getOverdueActionItemsCount } from "./get-overdue-action-items-count";
import { getScopedOperationalKpis } from "./get-scoped-operational-kpis";

const EMPTY_MANAGERIAL = {
  pendingEvaluation: null,
  activeInterdictions: null,
  awaitingValidation: null,
  mdhoPendingApproval: null,
  dueSoonActionItems: null,
  openActionPlans: null,
  pendingAwarenessOrg: null,
  newOccurrencesInPeriod: null,
  avgEvaluationTimeMinutes: null,
  avgReleaseTimeMinutes: null,
  actionCompletionRate: null,
} as const;

const FALLBACK_UNAVAILABLE_MESSAGE =
  "Indicadores do dashboard indisponíveis: RPC falhou e o fallback client-side expirou (S32-FIN-M01).";

async function getMobileDashboardKpisClientFallback(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<DashboardKpis> {
  const [personalActions, personalAwareness, activeOccurrences, overdueActionItems, operational] =
    await Promise.all([
      getMyActionItemsSummary(organizationId, access),
      getMyAwarenessSummary(organizationId, access),
      getActiveOccurrencesCount(organizationId, access),
      getOverdueActionItemsCount(organizationId, access),
      getScopedOperationalKpis(organizationId, access),
    ]);

  return {
    personal: {
      myPendingActions: personalActions.myPendingActions,
      myOverdueActions: personalActions.myOverdueActions,
      myPendingAwareness: personalAwareness.myPendingAwareness,
    },
    operational,
    managerial: {
      ...EMPTY_MANAGERIAL,
      activeOccurrences,
      overdueActionItems,
    },
  };
}

export async function getMobileDashboardKpis(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<DashboardKpis> {
  const rpcPayload = await fetchDashboardKpisRpc(organizationId);

  if (rpcPayload) {
    return toDashboardKpis(rpcPayload);
  }

  if (!isDashboardClientFallbackAllowed()) {
    throw new Error(FALLBACK_UNAVAILABLE_MESSAGE);
  }

  return getMobileDashboardKpisClientFallback(organizationId, access);
}
