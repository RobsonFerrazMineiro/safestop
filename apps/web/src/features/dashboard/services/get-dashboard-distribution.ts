import type { DashboardAccessContext, DashboardPeriodFilter } from "@safestop/types";
import {
  canAccessOccurrenceMetrics,
  extractDashboardDistributionFromRpc,
  isDashboardClientFallbackAllowed,
} from "@safestop/types";

import { fetchDashboardKpisRpc } from "./fetch-dashboard-kpis-rpc";
import {
  getOccurrencesByArea,
  getOccurrencesByContractor,
  getOccurrencesByStatus,
} from "./get-occurrences-distribution";
import { getOccurrencesByStatusFamily } from "./get-occurrences-by-status-family";

type DashboardDistributionFilters = {
  period?: DashboardPeriodFilter | null;
};

const FALLBACK_UNAVAILABLE_MESSAGE =
  "Distribuição do dashboard indisponível: RPC falhou e o fallback client-side expirou (S32-FIN-M01).";

export async function getDashboardDistribution(
  organizationId: string,
  access: DashboardAccessContext,
  filters: DashboardDistributionFilters = {},
) {
  if (!canAccessOccurrenceMetrics(access)) {
    return {
      byStatusFamily: null,
      byStatus: null,
      byArea: null,
      byContractor: null,
    };
  }

  const rpcPayload = await fetchDashboardKpisRpc(organizationId, {
    period: filters.period,
  });

  if (rpcPayload) {
    const fromRpc = extractDashboardDistributionFromRpc(rpcPayload);

    const [byStatus, byContractor] = await Promise.all([
      getOccurrencesByStatus(organizationId, access),
      filters.period
        ? getOccurrencesByContractor(organizationId, access, filters.period)
        : Promise.resolve(null),
    ]);

    return {
      byStatusFamily: fromRpc.byStatusFamily,
      byStatus,
      byArea: filters.period ? fromRpc.byArea : null,
      byContractor,
    };
  }

  if (!isDashboardClientFallbackAllowed()) {
    throw new Error(FALLBACK_UNAVAILABLE_MESSAGE);
  }

  const [byStatusFamily, byStatus, byArea, byContractor] = await Promise.all([
    getOccurrencesByStatusFamily(organizationId, access),
    getOccurrencesByStatus(organizationId, access),
    filters.period
      ? getOccurrencesByArea(organizationId, access, filters.period)
      : Promise.resolve(null),
    filters.period
      ? getOccurrencesByContractor(organizationId, access, filters.period)
      : Promise.resolve(null),
  ]);

  return {
    byStatusFamily,
    byStatus,
    byArea,
    byContractor,
  };
}
