import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateOccurrenceInput } from "@safestop/validation";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useActiveWorkspace } from "@/features/workspace";

import { createOccurrence } from "../services/create-occurrence";
import type { CreateOccurrenceResult } from "../services/types";
import { occurrenceQueryKeys } from "../types";

export function useCreateOccurrence() {
  const queryClient = useQueryClient();
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const canCreate = can("occurrence.create");

  const mutation = useMutation({
    mutationFn: (input: CreateOccurrenceInput) => {
      if (!organizationId) {
        throw new Error("Organização ativa não definida.");
      }

      if (!workspaceId) {
        throw new Error("Workspace ativo é obrigatório para registrar a ocorrência.");
      }

      return createOccurrence({
        organizationId,
        workspaceId,
        input,
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
    createOccurrence: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    createdOccurrence: mutation.data,
    reset: mutation.reset,
    canCreate: isReady && canCreate && Boolean(workspaceId),
    hasActiveWorkspace: workspaceId !== undefined,
  };
}
