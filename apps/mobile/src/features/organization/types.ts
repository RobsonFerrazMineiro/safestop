export type UserOrganization = {
  id: string;
  name: string;
  code: string | null;
  logoUrl: null;
  organizationType: string;
  organizationMemberId: string;
};

export const ORGANIZATION_QUERY_KEYS = {
  list: (userId: string) => ["organizations", "list", userId] as const,
};

export const TENANT_QUERY_KEY_PREFIX = "tenant" as const;

export type OrganizationContextValue = {
  organizations: UserOrganization[];
  activeOrganization: UserOrganization | null;
  isLoading: boolean;
  isReady: boolean;
  hasMultipleOrganizations: boolean;
  hasNoOrganizations: boolean;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  refetchOrganizations: () => Promise<void>;
};
