/**
 * Prefixo obrigatório para query keys com escopo de tenant (Sprint 1.9+).
 * Exemplo: ["tenant", organizationId, "occurrences", "list"]
 */
export const TENANT_QUERY_KEY_PREFIX = "tenant" as const;

export const ORGANIZATIONS_QUERY_KEY = "organizations" as const;

export function organizationListQueryKey(userId: string) {
  return [ORGANIZATIONS_QUERY_KEY, "list", userId] as const;
}

export type UserOrganization = {
  id: string;
  name: string;
  code: string | null;
  logoUrl: null;
  organizationType: string;
  organizationMemberId: string;
};

export type OrganizationContextValue = {
  organizations: UserOrganization[];
  activeOrganization: UserOrganization | null;
  isLoading: boolean;
  isReady: boolean;
  hasMultipleOrganizations: boolean;
  setActiveOrganization: (organizationId: string) => void;
};
