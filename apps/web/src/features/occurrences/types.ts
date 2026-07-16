import type { OccurrenceListFilters } from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

/** Lista tenant-scoped — 30s (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_LIST_STALE_TIME_MS = 30_000;

/** Detalhe tenant-scoped — 60s (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_DETAIL_STALE_TIME_MS = 60_000;

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

export function occurrenceQueryKeys(organizationId: string) {
  const root = [TENANT_QUERY_KEY_PREFIX, organizationId, "occurrences"] as const;

  return {
    all: root,
    lists: () => [...root, "list"] as const,
    list: (filters: OccurrenceListFilters = {}) => [...root, "list", filters] as const,
    details: () => [...root, "detail"] as const,
    detail: (occurrenceId: string) => [...root, "detail", occurrenceId] as const,
    areas: () => [TENANT_QUERY_KEY_PREFIX, organizationId, "areas", "list"] as const,
  };
}
