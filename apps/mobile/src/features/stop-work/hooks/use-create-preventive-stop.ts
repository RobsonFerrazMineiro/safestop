import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPreventiveStopSchema,
  type CreatePreventiveStopInput,
  type CreatePreventiveStopPayload,
} from "@safestop/validation";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { createOccurrence } from "@/features/occurrences/services/create-occurrence";
import type { CreateOccurrenceResult } from "@/features/occurrences/services/types";
import { occurrenceQueryKeys } from "@/features/occurrences/types";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useActiveWorkspace } from "@/features/workspace";

export function useCreatePreventiveStop() {
  const queryClient = useQueryClient();
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const canCreate = can("occurrence.create");

  const mutation = useMutation({
    mutationFn: (input: CreatePreventiveStopInput | CreatePreventiveStopPayload) => {
      if (!organizationId) {
        throw new Error("Organização ativa não definida.");
      }

      if (!workspaceId) {
        throw new Error("Workspace ativo é obrigatório para registrar a ocorrência.");
      }

      const payload = createPreventiveStopSchema.parse(input);

      return createOccurrence({
        organizationId,
        workspaceId,
        input: payload,
      });
    },
    onSuccess: async (result: CreateOccurrenceResult) => {
      if (!organizationId || !workspaceId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: occurrenceQueryKeys.workspaceLists(organizationId, workspaceId),
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
    canCreate: isReady && canCreate && Boolean(workspaceId),
    hasActiveWorkspace: workspaceId !== undefined,
  };
}
