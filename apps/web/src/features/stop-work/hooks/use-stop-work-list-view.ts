"use client";

import { useQuery } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";
import type { OccurrenceListFilters } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useOccurrences } from "@/features/occurrences";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useDashboardAttention } from "@/features/dashboard/hooks/use-dashboard-attention";
import { DASHBOARD_DUE_SOON_DAYS_DEFAULT } from "@safestop/types";

import { PREVENTIVE_STOP_LIST_FILTERS } from "../constants";
import { getOpenActionPlanOccurrenceIds } from "../services/get-open-action-plan-occurrence-ids";
import { getOperationalContactScopes } from "../services/get-operational-contact-scopes";
import {
  DASHBOARD_ATTENTION,
  DASHBOARD_LIST_FILTER,
  DASHBOARD_LIST_SCOPE,
  occurrenceFiltersForDashboardFilter,
  type StopWorkListViewParams,
} from "../utils/dashboard-list-params";
import { filterOccurrencesByOperationalScope } from "../utils/filter-operational-scope";

function resolveOccurrenceFilters(params: StopWorkListViewParams): OccurrenceListFilters {
  if (params.imsReferenceCode) {
    return { imsReferenceCode: params.imsReferenceCode };
  }

  if (params.dashboardFilter) {
    return occurrenceFiltersForDashboardFilter(params.dashboardFilter);
  }

  return PREVENTIVE_STOP_LIST_FILTERS;
}

export function useStopWorkListView(params: StopWorkListViewParams) {
  const { can, canAny } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const organizationMemberId = activeOrganization?.organizationMemberId ?? "";

  const isAttentionView = params.dashboardAttention !== null;
  const occurrenceFilters = resolveOccurrenceFilters(params);
  const occurrencesQuery = useOccurrences(occurrenceFilters, { enabled: !isAttentionView });
  const attentionQuery = useDashboardAttention({ dueSoonDays: DASHBOARD_DUE_SOON_DAYS_DEFAULT });

  const needsOpenActionPlanIds =
    params.dashboardFilter === DASHBOARD_LIST_FILTER.openActionPlans && !isAttentionView;
  const needsOperationalScope =
    params.dashboardScope === DASHBOARD_LIST_SCOPE.operational && !isAttentionView;

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

  let occurrences = isAttentionView ? [] : occurrencesQuery.occurrences;

  if (needsOpenActionPlanIds && openActionPlanIdsQuery.data) {
    const allowedIds = new Set(openActionPlanIdsQuery.data);
    occurrences = occurrences.filter((item) => allowedIds.has(item.id));
  }

  if (needsOperationalScope && operationalScopeQuery.data) {
    occurrences = filterOccurrencesByOperationalScope(occurrences, operationalScopeQuery.data);
  }

  const attentionItems =
    params.dashboardAttention === DASHBOARD_ATTENTION.overdue
      ? (attentionQuery.attention?.overdueItems ?? [])
      : params.dashboardAttention === DASHBOARD_ATTENTION.dueSoon
        ? (attentionQuery.attention?.dueSoonItems ?? [])
        : [];

  const isLoading = isAttentionView
    ? attentionQuery.isLoading
    : occurrencesQuery.isLoading ||
      (needsOpenActionPlanIds && openActionPlanIdsQuery.isLoading) ||
      (needsOperationalScope && operationalScopeQuery.isLoading);

  const isError = isAttentionView
    ? attentionQuery.isError
    : occurrencesQuery.isError || openActionPlanIdsQuery.isError || operationalScopeQuery.isError;

  const error =
    occurrencesQuery.error ?? openActionPlanIdsQuery.error ?? operationalScopeQuery.error;

  const canViewAttention =
    isAttentionView &&
    canAny(["action_plan.create", "action_plan.manage", "action_plan.validate"]) &&
    can("occurrence.read");

  return {
    occurrences,
    attentionItems,
    isAttentionView,
    canViewAttention,
    isLoading,
    isError,
    error,
    refetch: () => {
      if (isAttentionView) {
        void attentionQuery.refetch();
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
