import { PREVENTIVE_STOP_LIST_FILTER_STATUSES } from "@safestop/types";

import { useOccurrences } from "@/features/occurrences/hooks/use-occurrences";

type UsePreventiveStopsOptions = {
  imsReferenceCode?: string;
  enabled?: boolean;
};

export function usePreventiveStops(options: UsePreventiveStopsOptions = {}) {
  const imsReferenceCode = options.imsReferenceCode?.trim();

  const result = useOccurrences({
    enabled: options.enabled,
    filters: {
      status: [...PREVENTIVE_STOP_LIST_FILTER_STATUSES],
      ...(imsReferenceCode ? { imsReferenceCode } : {}),
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
