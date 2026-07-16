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
};

export type OccurrenceAreaOption = {
  id: string;
  name: string;
  code: string | null;
};

export type OccurrenceSyncStatus = "saved_locally" | "registered_on_server";
