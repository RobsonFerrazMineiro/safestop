"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  OccurrenceReportFilters,
  OccurrenceReportSort,
  ReportPagination,
} from "@safestop/types";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";
import { reportKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { listOccurrencesReport } from "../services/list-occurrences-report";

export function useOccurrencesReport(
  filters: OccurrenceReportFilters,
  sort: OccurrenceReportSort,
  pagination: ReportPagination,
  enabled: boolean,
) {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const queryEnabled = enabled && organizationId.length > 0;

  const query = useQuery({
    queryKey: reportKeys.occurrences(organizationId, filters, pagination, sort),
    queryFn: () => listOccurrencesReport(organizationId, filters, sort, pagination),
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
