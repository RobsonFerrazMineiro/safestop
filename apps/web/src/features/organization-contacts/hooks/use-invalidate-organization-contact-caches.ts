"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { organizationContactQueryKeys } from "@safestop/query-keys";

export function useInvalidateOrganizationContactCaches() {
  const queryClient = useQueryClient();

  return useCallback(
    async (organizationId: string) => {
      await queryClient.invalidateQueries({
        queryKey: organizationContactQueryKeys.all(organizationId),
      });
    },
    [queryClient],
  );
}
