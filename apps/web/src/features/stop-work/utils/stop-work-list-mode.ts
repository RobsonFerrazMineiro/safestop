import type { StopWorkListViewParams } from "./dashboard-list-params";
import { DASHBOARD_LIST_FILTER, DASHBOARD_LIST_SCOPE } from "./dashboard-list-params";

export type StopWorkListDataSource = "attention" | "legacy-unbounded" | "operational-rpc";

export function isAttentionStopWorkList(params: StopWorkListViewParams): boolean {
  return params.dashboardAttention !== null;
}

/**
 * Escopos que o DTO da RPC operacional não cobre (faltam IDs de plano/contato).
 * Mantêm getOccurrences unbounded + pós-filtro. Não paginar e filtrar a página.
 */
export function isLegacyUnboundedStopWorkList(params: StopWorkListViewParams): boolean {
  if (isAttentionStopWorkList(params)) {
    return false;
  }

  return (
    params.dashboardFilter === DASHBOARD_LIST_FILTER.openActionPlans ||
    params.dashboardScope === DASHBOARD_LIST_SCOPE.operational
  );
}

export function isStandardOperationalStopWorkList(params: StopWorkListViewParams): boolean {
  return (
    params.dashboardAttention === null &&
    params.dashboardFilter === null &&
    params.dashboardScope === null
  );
}

export function resolveStopWorkListDataSource(
  params: StopWorkListViewParams,
): StopWorkListDataSource {
  if (isAttentionStopWorkList(params)) {
    return "attention";
  }

  if (isLegacyUnboundedStopWorkList(params)) {
    return "legacy-unbounded";
  }

  return "operational-rpc";
}
