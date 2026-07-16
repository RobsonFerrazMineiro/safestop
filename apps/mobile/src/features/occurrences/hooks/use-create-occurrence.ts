import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateOccurrenceInput } from "@safestop/validation";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { createOccurrence } from "../services/create-occurrence";
import type { CreateOccurrenceResult } from "../services/types";
import { occurrenceQueryKeys } from "../types";

export function useCreateOccurrence() {
  const queryClient = useQueryClient();
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canCreate = can("occurrence.create");

  const mutation = useMutation({
    mutationFn: (input: CreateOccurrenceInput) => {
      if (!organizationId) {
        throw new Error("Organização ativa não definida.");
      }

      return createOccurrence({
        organizationId,
        input,
      });
    },
    onSuccess: async (result: CreateOccurrenceResult) => {
      if (!organizationId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: occurrenceQueryKeys.lists(organizationId),
      });

      await queryClient.invalidateQueries({
        queryKey: occurrenceQueryKeys.detail(organizationId, result.id),
      });
    },
  });

  return {
    createOccurrence: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    createdOccurrence: mutation.data,
    reset: mutation.reset,
    canCreate: isReady && canCreate,
  };
}
