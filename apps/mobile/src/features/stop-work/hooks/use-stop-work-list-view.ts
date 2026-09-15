import type { OccurrenceListFilters } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useOperationalOccurrences } from "@/features/occurrences/hooks/use-operational-occurrences";
import { useDashboardAttention } from "@/features/dashboard/hooks/use-dashboard-attention";

import {
  DASHBOARD_ATTENTION,
  DASHBOARD_ATTENTION_SCOPE,
  type DashboardAttentionFilter,
  type DashboardAttentionScope,
} from "../utils/dashboard-list-params";

type UseStopWorkListViewOptions = {
  dashboardAttention?: DashboardAttentionFilter | null;
  dashboardAttentionScope?: DashboardAttentionScope;
  operationalFilters?: OccurrenceListFilters;
};

export function useStopWorkListView({
  dashboardAttention = null,
  dashboardAttentionScope = DASHBOARD_ATTENTION_SCOPE.organization,
  operationalFilters = {},
}: UseStopWorkListViewOptions = {}) {
  const { can, canAny } = useAuthorization();
  const isAttentionView = dashboardAttention !== null;

  const operationalQuery = useOperationalOccurrences(operationalFilters, {
    enabled: !isAttentionView,
  });
  const attentionQuery = useDashboardAttention({
    enabled: isAttentionView,
    scope: dashboardAttentionScope,
  });

  const canViewAttention =
    isAttentionView &&
    canAny(["action_plan.create", "action_plan.manage", "action_plan.validate"]) &&
    can("occurrence.read");

  const attentionItems =
    dashboardAttention === DASHBOARD_ATTENTION.pending
      ? (attentionQuery.attention?.pendingItems ?? [])
      : dashboardAttention === DASHBOARD_ATTENTION.overdue
        ? (attentionQuery.attention?.overdueItems ?? [])
        : dashboardAttention === DASHBOARD_ATTENTION.dueSoon
          ? (attentionQuery.attention?.dueSoonItems ?? [])
          : [];

  const isLoading = isAttentionView ? attentionQuery.isLoading : operationalQuery.isLoading;

  const isFetching = isAttentionView ? attentionQuery.isFetching : operationalQuery.isFetching;

  const isError = isAttentionView ? attentionQuery.isError : operationalQuery.isError;

  const refetch = () => {
    if (isAttentionView) {
      void attentionQuery.refetch();
      return;
    }

    void operationalQuery.refetch();
  };

  return {
    preventiveStops: isAttentionView ? [] : operationalQuery.occurrences,
    attentionItems,
    isAttentionView,
    canViewAttention,
    hasNext: !isAttentionView && operationalQuery.hasNext,
    isFetchingNextPage: !isAttentionView && operationalQuery.isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
    error: isAttentionView ? undefined : operationalQuery.error,
    refetch,
    canRead: operationalQuery.canRead,
    fetchNextPage: () => {
      if (!isAttentionView) {
        void operationalQuery.fetchNextPage();
      }
    },
  };
}
