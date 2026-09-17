import {
  useCreateOccurrence,
  useOccurrence,
  useOccurrences,
  useOccurrenceStatusHistory,
  useWorkspaceAreas,
  useWorkspaceContracts,
} from "@/features/occurrences";
import type { OccurrenceListFilters } from "@safestop/types";
import { createPreventiveStopSchema, type CreatePreventiveStopInput } from "@safestop/validation";

import { PREVENTIVE_STOP_LIST_FILTERS, PREVENTIVE_STOP_STATUS } from "../constants";

export function usePreventiveStops(filters: OccurrenceListFilters = PREVENTIVE_STOP_LIST_FILTERS) {
  const imsQuery = filters.imsReferenceCode?.trim();
  const resolvedFilters: OccurrenceListFilters =
    imsQuery && imsQuery.length > 0 ? { imsReferenceCode: imsQuery } : filters;

  return useOccurrences(resolvedFilters);
}

export function usePreventiveStop(occurrenceId: string | undefined) {
  const result = useOccurrence(occurrenceId);

  const isPreventiveStop = result.occurrence?.status === PREVENTIVE_STOP_STATUS;

  return {
    ...result,
    stopWork: result.occurrence ?? null,
    isPreventiveStop,
    isNotFound: result.isNotFound,
  };
}

export function usePreventiveStopHistory(occurrenceId: string | undefined) {
  return useOccurrenceStatusHistory(occurrenceId);
}

export function usePreventiveStopAreas() {
  return useWorkspaceAreas();
}

export function usePreventiveStopContracts() {
  return useWorkspaceContracts();
}

/** Cascata operacional do Create (executoras + contratos da RPC). */
export function usePreventiveStopContractors() {
  const result = useWorkspaceContracts();
  return {
    executors: result.executors,
    contracts: result.contracts,
    allowsOwnTeam: result.allowsOwnTeam,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  };
}

export function useCreatePreventiveStop() {
  const { createOccurrence, isCreating, error, reset } = useCreateOccurrence();

  return {
    createPreventiveStop: async (input: CreatePreventiveStopInput) => {
      const payload = createPreventiveStopSchema.parse(input);
      return createOccurrence(payload);
    },
    isCreating,
    error,
    reset,
  };
}
