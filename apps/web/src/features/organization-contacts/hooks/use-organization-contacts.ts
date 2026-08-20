"use client";

import { useQuery } from "@tanstack/react-query";
import { organizationContactQueryKeys } from "@safestop/query-keys";
import type { OrganizationContactListFilters } from "@safestop/types";

import { listOrganizationContacts } from "../services/list-organization-contacts";
import { ORGANIZATION_CONTACT_STALE_TIME_MS } from "../types";

export function useOrganizationContacts(
  organizationId: string,
  filters: OrganizationContactListFilters,
  enabled: boolean,
) {
  const query = useQuery({
    queryKey: organizationContactQueryKeys.list(organizationId, filters),
    queryFn: () => listOrganizationContacts(organizationId, filters),
    enabled: enabled && organizationId.length > 0,
    staleTime: ORGANIZATION_CONTACT_STALE_TIME_MS,
  });

  return {
    contacts: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
