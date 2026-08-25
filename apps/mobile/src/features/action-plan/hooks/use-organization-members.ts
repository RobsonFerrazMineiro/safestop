import { useQuery } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOrganizationMembers } from "../services/get-organization-members";

export function useOrganizationMembers() {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: [TENANT_QUERY_KEY_PREFIX, organizationId, "organization-members"],
    queryFn: () => getOrganizationMembers(organizationId!),
    enabled: !!organizationId,
    staleTime: 60_000,
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
  };
}
