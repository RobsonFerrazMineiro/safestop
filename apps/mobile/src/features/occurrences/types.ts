import type { OccurrenceListFilters } from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "@/features/organization/types";

export const OCCURRENCES_SCOPE = "occurrences" as const;

export const occurrenceQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, OCCURRENCES_SCOPE] as const,
  lists: (organizationId: string) => [...occurrenceQueryKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, filters?: OccurrenceListFilters) =>
    [...occurrenceQueryKeys.lists(organizationId), filters ?? {}] as const,
  details: (organizationId: string) =>
    [...occurrenceQueryKeys.all(organizationId), "detail"] as const,
  detail: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.details(organizationId), occurrenceId] as const,
  areas: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "areas", "list"] as const,
  contractors: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "contractors", "list"] as const,
  contracts: (organizationId: string, contractorOrganizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "contracts", contractorOrganizationId] as const,
  timeline: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.detail(organizationId, occurrenceId), "timeline"] as const,
  timelinePage: (organizationId: string, occurrenceId: string, cursor: string | null = null) =>
    [...occurrenceQueryKeys.timeline(organizationId, occurrenceId), cursor ?? "initial"] as const,
  /** Decisão vigente 1:1 — embed ou query dedicada (VER-E-AGIR-DECISIONS § Cache). */
  decision: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.detail(organizationId, occurrenceId), "decision"] as const,
  /** Avaliação MDHO 1:1 por ocorrência (MDHO-DECISIONS § Cache). */
  mdho: (organizationId: string, occurrenceId: string) =>
    [...occurrenceQueryKeys.detail(organizationId, occurrenceId), "mdho"] as const,
  /** Catálogo MDHO tenant-scoped (global + org). */
  mdhoCatalog: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, "mdho", "catalog"] as const,
};

export type OccurrenceAreaOption = {
  id: string;
  name: string;
  code: string | null;
};

export type OccurrenceContractorOption = {
  id: string;
  name: string;
};

export type OccurrenceContractOption = {
  id: string;
  contractNumber: string | null;
  name: string;
};

export type OccurrenceSyncStatus = "saved_locally" | "registered_on_server";
