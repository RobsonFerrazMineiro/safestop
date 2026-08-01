import {
  useContractorOrganizations,
  useCreateOccurrence,
  useOccurrence,
  useOccurrences,
  useOccurrenceStatusHistory,
  useOrganizationAreas,
} from "@/features/occurrences";
import { createPreventiveStopSchema, type CreatePreventiveStopInput } from "@safestop/validation";

import { PREVENTIVE_STOP_LIST_FILTERS, PREVENTIVE_STOP_STATUS } from "../constants";

export function usePreventiveStops() {
  return useOccurrences(PREVENTIVE_STOP_LIST_FILTERS);
}

export function usePreventiveStop(occurrenceId: string | undefined) {
  const result = useOccurrence(occurrenceId);

  const isPreventiveStop =
    result.occurrence !== null && result.occurrence !== undefined
      ? result.occurrence.status === PREVENTIVE_STOP_STATUS
      : false;

  return {
    ...result,
    stopWork: isPreventiveStop ? result.occurrence : null,
    isPreventiveStop,
    isNotFound: result.isNotFound || (result.isReady && !isPreventiveStop),
  };
}

export function usePreventiveStopHistory(occurrenceId: string | undefined) {
  return useOccurrenceStatusHistory(occurrenceId);
}

export function usePreventiveStopAreas() {
  return useOrganizationAreas();
}

export function usePreventiveStopContractors() {
  return useContractorOrganizations();
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
