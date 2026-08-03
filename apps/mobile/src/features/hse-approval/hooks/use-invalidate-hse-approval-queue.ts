import { useQueryClient } from "@tanstack/react-query";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { hseApprovalQueryKeys } from "../types";

export function useInvalidateHseApprovalQueue() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return async function invalidateHseApprovalQueue() {
    const organizationId = activeOrganization?.id;

    if (!organizationId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: hseApprovalQueryKeys.queue(organizationId),
    });
  };
}
