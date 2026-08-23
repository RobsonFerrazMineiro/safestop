import type {
  ActionItemReportFilters,
  AwarenessReportFilters,
  OccurrenceReportFilters,
  ReportPagination,
  ReportSort,
} from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "./tenant";

export const REPORT_SCOPE = "reports" as const;

export const reportKeys = {
  all: (organizationId: string) => [TENANT_QUERY_KEY_PREFIX, organizationId, REPORT_SCOPE] as const,
  occurrences: (
    organizationId: string,
    filters: OccurrenceReportFilters = {},
    pagination: ReportPagination = {},
    sort?: ReportSort<string>,
  ) => [...reportKeys.all(organizationId), "occurrences", filters, pagination, sort] as const,
  actionItems: (
    organizationId: string,
    filters: ActionItemReportFilters = {},
    pagination: ReportPagination = {},
    sort?: ReportSort<string>,
  ) => [...reportKeys.all(organizationId), "action-items", filters, pagination, sort] as const,
  awareness: (
    organizationId: string,
    filters: AwarenessReportFilters = {},
    pagination: ReportPagination = {},
    sort?: ReportSort<string>,
  ) => [...reportKeys.all(organizationId), "awareness", filters, pagination, sort] as const,
};
