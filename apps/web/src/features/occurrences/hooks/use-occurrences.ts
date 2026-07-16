"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateOccurrenceInput } from "@safestop/validation";
import type { OccurrenceListFilters } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { createOccurrence } from "../services/create-occurrence";
import { getOccurrence, getOccurrences } from "../services/get-occurrences";
import { getOrganizationAreas } from "../services/get-organization-areas";
import {
  OCCURRENCE_DETAIL_STALE_TIME_MS,
  OCCURRENCE_LIST_STALE_TIME_MS,
  occurrenceQueryKeys,
} from "../types";

export function useOccurrences(filters: OccurrenceListFilters = {}) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled = isOrgReady && isAuthzReady && organizationId !== undefined && canRead;

  const query = useQuery({
    queryKey: occurrenceQueryKeys(organizationId ?? "").list(filters),
    queryFn: () => getOccurrences(organizationId!, filters),
    enabled,
    staleTime: OCCURRENCE_LIST_STALE_TIME_MS,
  });

  return {
    occurrences: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isReady: enabled && query.isSuccess,
    refetch: query.refetch,
  };
}

export function useOccurrence(occurrenceId: string | undefined) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled =
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    occurrenceId !== undefined &&
    occurrenceId.length > 0 &&
    canRead;

  const query = useQuery({
    queryKey: occurrenceQueryKeys(organizationId ?? "").detail(occurrenceId ?? ""),
    queryFn: () => getOccurrence(organizationId!, occurrenceId!),
    enabled,
    staleTime: OCCURRENCE_DETAIL_STALE_TIME_MS,
  });

  return {
    occurrence: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    isNotFound: enabled && query.isSuccess && query.data === null,
    isReady: enabled && query.isSuccess,
  };
}

export function useOrganizationAreas() {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canCreate = can("occurrence.create");
  const enabled = isOrgReady && isAuthzReady && organizationId !== undefined && canCreate;

  const query = useQuery({
    queryKey: occurrenceQueryKeys(organizationId ?? "").areas(),
    queryFn: () => getOrganizationAreas(organizationId!),
    enabled,
    staleTime: OCCURRENCE_LIST_STALE_TIME_MS,
  });

  return {
    areas: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

export function useCreateOccurrence() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const mutation = useMutation({
    mutationFn: (input: CreateOccurrenceInput) => {
      if (!organizationId) {
        throw new Error("Organização ativa não definida.");
      }

      return createOccurrence(organizationId, input);
    },
    onSuccess: async () => {
      if (!organizationId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: occurrenceQueryKeys(organizationId).lists(),
      });
    },
  });

  return {
    createOccurrence: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
