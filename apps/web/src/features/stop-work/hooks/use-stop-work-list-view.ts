"use client";

import { useQuery } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";
import type { OccurrenceListFilters, OccurrenceSummary } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useOccurrences, useOperationalOccurrences } from "@/features/occurrences";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useDashboardAttention } from "@/features/dashboard/hooks/use-dashboard-attention";
import { DASHBOARD_DUE_SOON_DAYS_DEFAULT } from "@safestop/types";

import { PREVENTIVE_STOP_LIST_FILTERS } from "../constants";
import { getOpenActionPlanOccurrenceIds } from "../services/get-open-action-plan-occurrence-ids";
import { getOperationalContactScopes } from "../services/get-operational-contact-scopes";
import {
  DASHBOARD_ATTENTION,
  DASHBOARD_LIST_FILTER,
  occurrenceFiltersForDashboardFilter,
  type StopWorkListViewParams,
} from "../utils/dashboard-list-params";
import { filterOccurrencesByOperationalScope } from "../utils/filter-operational-scope";
import {
  isStandardOperationalStopWorkList,
  resolveStopWorkListDataSource,
} from "../utils/stop-work-list-mode";

function resolveLegacyOccurrenceFilters(params: StopWorkListViewParams): OccurrenceListFilters {
  if (params.dashboardFilter) {
    return occurrenceFiltersForDashboardFilter(params.dashboardFilter);
  }

  return PREVENTIVE_STOP_LIST_FILTERS;
}

function resolveRpcOccurrenceFilters(
  params: StopWorkListViewParams,
  operationalFilters: OccurrenceListFilters,
): OccurrenceListFilters {
  if (isStandardOperationalStopWorkList(params)) {
    return operationalFilters;
  }

  if (params.dashboardFilter) {
    return occurrenceFiltersForDashboardFilter(params.dashboardFilter);
  }

  return operationalFilters;
}

type UseStopWorkListViewOptions = {
  operationalFilters?: OccurrenceListFilters;
};

export function useStopWorkListView(
  params: StopWorkListViewParams,
  options: UseStopWorkListViewOptions = {},
) {
  const { can, canAny } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const organizationMemberId = activeOrganization?.organizationMemberId ?? "";

  const dataSource = resolveStopWorkListDataSource(params);
  const isAttentionView = dataSource === "attention";
  const isLegacyUnbounded = dataSource === "legacy-unbounded";
  const isOperationalRpc = dataSource === "operational-rpc";
  const operationalFilters = options.operationalFilters ?? {};

  const legacyFilters = resolveLegacyOccurrenceFilters(params);
  const rpcFilters = resolveRpcOccurrenceFilters(params, operationalFilters);

  const occurrencesQuery = useOccurrences(legacyFilters, {
    enabled: isLegacyUnbounded,
  });
  const operationalQuery = useOperationalOccurrences(rpcFilters, {
    enabled: isOperationalRpc,
  });
  const attentionQuery = useDashboardAttention({ dueSoonDays: DASHBOARD_DUE_SOON_DAYS_DEFAULT });

  const needsOpenActionPlanIds =
    params.dashboardFilter === DASHBOARD_LIST_FILTER.openActionPlans && isLegacyUnbounded;
  const needsOperationalScope = isLegacyUnbounded && params.dashboardScope !== null;

  const openActionPlanIdsQuery = useQuery({
    queryKey: [
      TENANT_QUERY_KEY_PREFIX,
      organizationId,
      "stop-work",
      "open-action-plan-occurrence-ids",
    ] as const,
    queryFn: () => getOpenActionPlanOccurrenceIds(organizationId),
    enabled: needsOpenActionPlanIds && organizationId.length > 0,
    staleTime: 30_000,
  });

  const operationalScopeQuery = useQuery({
    queryKey: [
      TENANT_QUERY_KEY_PREFIX,
      organizationId,
      "stop-work",
      organizationMemberId,
      "operational-contact-scopes",
    ] as const,
    queryFn: () => getOperationalContactScopes(organizationId, organizationMemberId),
    enabled: needsOperationalScope && organizationId.length > 0 && organizationMemberId.length > 0,
    staleTime: 60_000,
  });

  let occurrences: OccurrenceSummary[] = [];

  if (isOperationalRpc) {
    occurrences = operationalQuery.occurrences;
  } else if (isLegacyUnbounded) {
    let legacyOccurrences = occurrencesQuery.occurrences;

    if (needsOpenActionPlanIds && openActionPlanIdsQuery.data) {
      const allowedIds = new Set(openActionPlanIdsQuery.data);
      legacyOccurrences = legacyOccurrences.filter((item) => allowedIds.has(item.id));
    }

    if (needsOperationalScope && operationalScopeQuery.data) {
      legacyOccurrences = filterOccurrencesByOperationalScope(
        legacyOccurrences,
        operationalScopeQuery.data,
      );
    }

    occurrences = legacyOccurrences;
  }

  const attentionItems =
    params.dashboardAttention === DASHBOARD_ATTENTION.overdue
      ? (attentionQuery.attention?.overdueItems ?? [])
      : params.dashboardAttention === DASHBOARD_ATTENTION.dueSoon
        ? (attentionQuery.attention?.dueSoonItems ?? [])
        : [];

  const isLoading = isAttentionView
    ? attentionQuery.isLoading
    : isOperationalRpc
      ? operationalQuery.isLoading
      : occurrencesQuery.isLoading ||
        (needsOpenActionPlanIds && openActionPlanIdsQuery.isLoading) ||
        (needsOperationalScope && operationalScopeQuery.isLoading);

  const isError = isAttentionView
    ? attentionQuery.isError
    : isOperationalRpc
      ? operationalQuery.isError
      : occurrencesQuery.isError || openActionPlanIdsQuery.isError || operationalScopeQuery.isError;

  const error = isOperationalRpc
    ? operationalQuery.error
    : (occurrencesQuery.error ?? openActionPlanIdsQuery.error ?? operationalScopeQuery.error);

  const canViewAttention =
    isAttentionView &&
    canAny(["action_plan.create", "action_plan.manage", "action_plan.validate"]) &&
    can("occurrence.read");

  return {
    occurrences,
    attentionItems,
    isAttentionView,
    isStandardOperationalList: isStandardOperationalStopWorkList(params),
    canViewAttention,
    hasNext: isOperationalRpc ? operationalQuery.hasNext : false,
    isFetchingNextPage: isOperationalRpc ? operationalQuery.isFetchingNextPage : false,
    isLoading,
    isError,
    error,
    fetchNextPage: () => {
      if (isOperationalRpc) {
        void operationalQuery.fetchNextPage();
      }
    },
    refetch: () => {
      if (isAttentionView) {
        void attentionQuery.refetch();
        return;
      }

      if (isOperationalRpc) {
        void operationalQuery.refetch();
        return;
      }

      void occurrencesQuery.refetch();

      if (needsOpenActionPlanIds) {
        void openActionPlanIdsQuery.refetch();
      }

      if (needsOperationalScope) {
        void operationalScopeQuery.refetch();
      }
    },
  };
}
