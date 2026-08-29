"use client";

import { occurrenceQueryKeys } from "@safestop/query-keys";
import { useQuery } from "@tanstack/react-query";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getOccurrenceParticipants } from "../services/get-occurrence-participants";
import type { OccurrenceParticipantItem } from "../types";

type UseOccurrenceParticipantsResult = {
  participants: OccurrenceParticipantItem[];
  isLoading: boolean;
  isError: boolean;
};

export function useOccurrenceParticipants(occurrenceId: string): UseOccurrenceParticipantsResult {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";

  const query = useQuery({
    queryKey: occurrenceQueryKeys.participants(organizationId, occurrenceId),
    queryFn: () => getOccurrenceParticipants(occurrenceId),
    enabled: organizationId.length > 0 && occurrenceId.length > 0,
    staleTime: 60_000,
  });

  return {
    participants: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
