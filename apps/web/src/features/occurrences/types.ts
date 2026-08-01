import type {
  OccurrenceDetails,
  OccurrenceListFilters,
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceSummary,
} from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

/** Lista tenant-scoped — 30s (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_LIST_STALE_TIME_MS = 30_000;

/** Detalhe tenant-scoped — 60s (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_DETAIL_STALE_TIME_MS = 60_000;

/** Histórico de status — 5min (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_STATUS_HISTORY_STALE_TIME_MS = 5 * 60 * 1000;

export type OrganizationAreaOption = {
  id: string;
  name: string;
  code: string | null;
};

export type CreateOccurrenceResult = {
  id: string;
  publicCode: string;
  status: string;
};

export type OccurrenceSummaryEnriched = {
  id: string;
  publicCode: string;
  title: string;
  status: OccurrenceStatus;
  severity: OccurrenceSeverity;
  areaName: string | null;
  createdAt: string;
  createdByName: string | null;
  contractorOrganizationName: string | null;
};

export type OccurrenceDetailsEnriched = OccurrenceSummaryEnriched &
  Omit<OccurrenceDetails, keyof OccurrenceSummary>;

export type ContractorOrganizationOption = {
  id: string;
  name: string;
};

export type OccurrenceStatusHistoryItem = {
  id: string;
  fromStatus: OccurrenceStatus | null;
  toStatus: OccurrenceStatus;
  changedAt: string;
  changedByName: string | null;
};

export function occurrenceQueryKeys(organizationId: string) {
  const root = [TENANT_QUERY_KEY_PREFIX, organizationId, "occurrences"] as const;

  return {
    all: root,
    lists: () => [...root, "list"] as const,
    list: (filters: OccurrenceListFilters = {}) => [...root, "list", filters] as const,
    details: () => [...root, "detail"] as const,
    detail: (occurrenceId: string) => [...root, "detail", occurrenceId] as const,
    statusHistory: (occurrenceId: string) =>
      [...root, "detail", occurrenceId, "status-history"] as const,
    areas: () => [TENANT_QUERY_KEY_PREFIX, organizationId, "areas", "list"] as const,
    contractors: () => [TENANT_QUERY_KEY_PREFIX, organizationId, "contractors", "list"] as const,
  };
}
