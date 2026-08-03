import { useQueryClient } from "@tanstack/react-query";

import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

export function useInvalidateImsReferenceCaches() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return async function invalidateImsReferenceCaches(occurrenceId: string) {
    const organizationId = activeOrganization?.id;

    if (!organizationId) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: occurrenceQueryKeys.detail(organizationId, occurrenceId),
      }),
      queryClient.invalidateQueries({
        queryKey: occurrenceQueryKeys.lists(organizationId),
      }),
      queryClient.invalidateQueries({
        queryKey: occurrenceQueryKeys.timeline(organizationId, occurrenceId),
      }),
    ]);
  };
}
