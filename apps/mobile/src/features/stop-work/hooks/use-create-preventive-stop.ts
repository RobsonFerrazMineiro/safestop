import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPreventiveStopSchema, type CreatePreventiveStopInput } from "@safestop/validation";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { createOccurrence } from "@/features/occurrences/services/create-occurrence";
import type { CreateOccurrenceResult } from "@/features/occurrences/services/types";
import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

export function useCreatePreventiveStop() {
  const queryClient = useQueryClient();
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canCreate = can("occurrence.create");

  const mutation = useMutation({
    mutationFn: (input: CreatePreventiveStopInput) => {
      if (!organizationId) {
        throw new Error("Organização ativa não definida.");
      }

      const payload = createPreventiveStopSchema.parse(input);

      return createOccurrence({
        organizationId,
        input: payload,
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
    createPreventiveStop: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    createdPreventiveStop: mutation.data,
    reset: mutation.reset,
    canCreate: isReady && canCreate,
  };
}
