import { PREVENTIVE_STOP_LIST_FILTER_STATUSES } from "@safestop/types";

import { useOccurrences } from "@/features/occurrences/hooks/use-occurrences";

export function usePreventiveStops() {
  const result = useOccurrences({
    filters: {
      status: [...PREVENTIVE_STOP_LIST_FILTER_STATUSES],
    },
  });

  return {
    preventiveStops: result.occurrences,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    isReady: result.isReady,
    canRead: result.canRead,
  };
}
