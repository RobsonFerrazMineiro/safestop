import type { OccurrenceListFilters } from "@safestop/types";
import { OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT } from "@safestop/types";

/**
 * Normaliza filtros da lista operacional para query key + RPC.
 * `workspaceId` NÃO entra aqui — vai no path da key (`workspaceList`) e no payload RPC.
 */
export function buildOperationalOccurrenceListQueryFilters(
  filters: OccurrenceListFilters,
): OccurrenceListFilters {
  const next: OccurrenceListFilters = {
    pagination: {
      limit: filters.pagination?.limit ?? OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT,
    },
  };

  if (filters.search !== undefined) {
    next.search = filters.search;
  }

  if (filters.status !== undefined) {
    next.status = filters.status;
  }

  if (filters.severity !== undefined) {
    next.severity = filters.severity;
  }

  if (filters.areaId !== undefined) {
    next.areaId = filters.areaId;
  }

  if (filters.contractorOrganizationId !== undefined) {
    next.contractorOrganizationId = filters.contractorOrganizationId;
  }

  if (filters.imsReferenceCode !== undefined) {
    next.imsReferenceCode = filters.imsReferenceCode;
  }

  return next;
}

export function shouldEnableWorkspaceScopedOccurrenceList(input: {
  optionEnabled: boolean;
  isOrgReady: boolean;
  isAuthzReady: boolean;
  organizationId: string | undefined;
  workspaceId: string | undefined;
  canRead: boolean;
}): boolean {
  return (
    input.optionEnabled &&
    input.isOrgReady &&
    input.isAuthzReady &&
    input.organizationId !== undefined &&
    input.workspaceId !== undefined &&
    input.canRead
  );
}
