import type { OrganizationContactListFilters } from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "./tenant";

export const ORGANIZATION_CONTACTS_SCOPE = "organization-contacts" as const;

/** Query keys tenant-scoped de organization_contacts (Sprint 3.1). */
export const organizationContactQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, ORGANIZATION_CONTACTS_SCOPE] as const,
  list: (organizationId: string, filters: OrganizationContactListFilters = {}) =>
    [...organizationContactQueryKeys.all(organizationId), "list", filters] as const,
};
