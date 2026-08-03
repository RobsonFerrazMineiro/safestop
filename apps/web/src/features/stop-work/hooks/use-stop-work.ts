import {
  useContractorOrganizations,
  useCreateOccurrence,
  useOccurrence,
  useOccurrences,
  useOccurrenceStatusHistory,
  useOrganizationAreas,
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
