"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ActionItemReportFilters,
  ActionItemReportSort,
  ReportPagination,
} from "@safestop/types";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";
import { reportKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { listActionItemsReport } from "../services/list-action-items-report";

export function useActionItemsReport(
  filters: ActionItemReportFilters,
  sort: ActionItemReportSort,
  pagination: ReportPagination,
  enabled: boolean,
) {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const queryEnabled = enabled && organizationId.length > 0;

  const query = useQuery({
    queryKey: reportKeys.actionItems(organizationId, filters, pagination, sort),
    queryFn: () => listActionItemsReport(organizationId, filters, sort, pagination),
    enabled: queryEnabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data,
    isLoading: queryEnabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    organizationId,
    enabled: queryEnabled,
  };
}
