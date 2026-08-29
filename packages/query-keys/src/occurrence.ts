import type { OccurrenceListFilters } from "@safestop/types";

import { OCCURRENCES_SCOPE, TENANT_QUERY_KEY_PREFIX } from "./tenant";

/**
 * Query keys tenant-scoped de ocorrências (PO-CON-7).
 * API objeto — Web e Mobile compartilham a mesma superfície.
 */
export const occurrenceQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, OCCURRENCES_SCOPE] as const,
  lists: (organizationId: string) => [...occurrenceQueryKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, filters: OccurrenceListFilters = {}) =>
    [...occurrenceQueryKeys.lists(organizationId), filters] as const,
  details: (organizationId: string) =>
    [...occurrenceQueryKeys.all(organizationId), "detail"] as const,
  detail: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.details(organizationId), occurrenceId] as const,
  statusHistory: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.detail(organizationId, occurrenceId), "status-history"] as const,
  areas: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "areas", "list"] as const,
  contractors: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "contractors", "list"] as const,
  contracts: (organizationId: string, contractorOrganizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "contracts", contractorOrganizationId] as const,
  /** Prefixo timeline — invalidar todas as páginas. */
  timeline: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.detail(organizationId, occurrenceId), "timeline"] as const,
  timelinePage: (organizationId: string, occurrenceId: string, cursor: string | null = null) =>
    [...occurrenceQueryKeys.timeline(organizationId, occurrenceId), cursor ?? "initial"] as const,
  decision: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.detail(organizationId, occurrenceId), "decision"] as const,
  mdho: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.detail(organizationId, occurrenceId), "mdho"] as const,
  mdhoCatalog: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "mdho", "catalog"] as const,
  participants: (organizationId: string, occurrenceId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "occurrence-participants", occurrenceId] as const,
};
