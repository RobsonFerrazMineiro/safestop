import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useDashboardAttention } from "@/features/dashboard/hooks/use-dashboard-attention";

import { usePreventiveStops } from "./use-preventive-stops";
import { DASHBOARD_ATTENTION, type DashboardAttentionFilter } from "../utils/dashboard-list-params";

type UseStopWorkListViewOptions = {
  dashboardAttention?: DashboardAttentionFilter | null;
  imsReferenceCode?: string;
};

export function useStopWorkListView({
  dashboardAttention = null,
  imsReferenceCode,
}: UseStopWorkListViewOptions) {
  const { can, canAny } = useAuthorization();
  const isAttentionView = dashboardAttention !== null;

  const occurrencesQuery = usePreventiveStops({
    enabled: !isAttentionView,
    imsReferenceCode: isAttentionView ? undefined : imsReferenceCode,
  });
  const attentionQuery = useDashboardAttention({ enabled: isAttentionView });

  const canViewAttention =
    isAttentionView &&
    canAny(["action_plan.create", "action_plan.manage", "action_plan.validate"]) &&
    can("occurrence.read");

  const attentionItems =
    dashboardAttention === DASHBOARD_ATTENTION.overdue
      ? (attentionQuery.attention?.overdueItems ?? [])
      : dashboardAttention === DASHBOARD_ATTENTION.dueSoon
        ? (attentionQuery.attention?.dueSoonItems ?? [])
        : [];

  const isLoading = isAttentionView ? attentionQuery.isLoading : occurrencesQuery.isLoading;

  const isFetching = isAttentionView ? attentionQuery.isFetching : occurrencesQuery.isFetching;

  const isError = isAttentionView ? attentionQuery.isError : occurrencesQuery.isError;

  const refetch = () => {
    if (isAttentionView) {
      void attentionQuery.refetch();
      return;
    }

    void occurrencesQuery.refetch();
  };

  return {
    preventiveStops: isAttentionView ? [] : occurrencesQuery.preventiveStops,
    attentionItems,
    isAttentionView,
    canViewAttention,
    isLoading,
    isFetching,
    isError,
    refetch,
    canRead: occurrencesQuery.canRead,
  };
}
