import { useOccurrence } from "@/features/occurrences/hooks/use-occurrence";

export function usePreventiveStop(occurrenceId: string) {
  const result = useOccurrence(occurrenceId);

  return {
    preventiveStop: result.occurrence,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    isNotFound: result.isNotFound,
    refetch: result.refetch,
    isReady: result.isReady,
    canRead: result.canRead,
  };
}
