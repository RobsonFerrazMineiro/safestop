import { useQuery } from "@tanstack/react-query";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOrganizationMembers } from "../services/get-organization-members";

export function useOrganizationMembers() {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: () => getOrganizationMembers(organizationId!),
    enabled: !!organizationId,
    staleTime: 60_000,
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
  };
}
