"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useActiveWorkspace } from "@/features/workspace";

import { listAssignableMembers } from "../services/list-assignable-members";
import { listContractAssignments } from "../services/list-contract-assignments";
import { listWorkspaceContractsForAssignments } from "../services/list-workspace-contracts";
import {
  createContractAssignment,
  revokeContractAssignment,
} from "../services/mutate-contract-assignment";
import { contractAssignmentQueryKeys, type ContractAssignmentRole } from "../types";

const STALE_TIME_MS = 30_000;

export function useWorkspaceContractsForAssignments() {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const enabled =
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    workspaceId !== undefined &&
    can("organization.manage");

  const keys = contractAssignmentQueryKeys(organizationId ?? "", workspaceId ?? "");

  const query = useQuery({
    queryKey: keys.contracts,
    queryFn: () => listWorkspaceContractsForAssignments(workspaceId!),
    enabled,
    staleTime: STALE_TIME_MS,
  });

  return {
    contracts: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useContractAssignments(contractId: string | null) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const enabled =
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    workspaceId !== undefined &&
    contractId !== null &&
    can("organization.manage");

  const keys = contractAssignmentQueryKeys(organizationId ?? "", workspaceId ?? "");

  const query = useQuery({
    queryKey: keys.assignments(contractId ?? ""),
    queryFn: () => listContractAssignments(contractId!),
    enabled,
    staleTime: STALE_TIME_MS,
  });

  return {
    assignments: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAssignableMembers() {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();

  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;
  const enabled =
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    workspaceId !== undefined &&
    can("organization.manage");

  const keys = contractAssignmentQueryKeys(organizationId ?? "", workspaceId ?? "");

  const query = useQuery({
    queryKey: keys.assignableMembers,
    queryFn: () =>
      listAssignableMembers({
        organizationId: organizationId!,
        workspaceId: workspaceId!,
      }),
    enabled,
    staleTime: STALE_TIME_MS,
  });

  return {
    members: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

export function useCreateContractAssignment(contractId: string | null) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();
  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;

  const mutation = useMutation({
    mutationFn: (input: {
      organizationMemberId: string;
      assignmentRole: ContractAssignmentRole;
    }) => {
      if (!organizationId || !contractId) {
        throw new Error("Contexto da EMPRESA ou contrato ausente.");
      }

      return createContractAssignment({
        organizationId,
        organizationMemberId: input.organizationMemberId,
        contractId,
        assignmentRole: input.assignmentRole,
      });
    },
    onSuccess: async () => {
      if (!organizationId || !workspaceId || !contractId) {
        return;
      }

      const keys = contractAssignmentQueryKeys(organizationId, workspaceId);
      await queryClient.invalidateQueries({ queryKey: keys.assignments(contractId) });
    },
  });

  return {
    createAssignment: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useRevokeContractAssignment(contractId: string | null) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const { activeWorkspace } = useActiveWorkspace();
  const organizationId = activeOrganization?.id;
  const workspaceId = activeWorkspace?.id;

  const mutation = useMutation({
    mutationFn: (assignmentId: string) => revokeContractAssignment(assignmentId),
    onSuccess: async () => {
      if (!organizationId || !workspaceId || !contractId) {
        return;
      }

      const keys = contractAssignmentQueryKeys(organizationId, workspaceId);
      await queryClient.invalidateQueries({ queryKey: keys.assignments(contractId) });
    },
  });

  return {
    revokeAssignment: mutation.mutateAsync,
    isRevoking: mutation.isPending,
    error: mutation.error,
  };
}
