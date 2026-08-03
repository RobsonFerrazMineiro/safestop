import { useInvalidateOccurrenceDomain } from "@/features/occurrences/hooks/use-invalidate-occurrence-domain";

export function useInvalidateImsReferenceCaches() {
  const invalidateDomain = useInvalidateOccurrenceDomain();

  return async function invalidateImsReferenceCaches(occurrenceId: string) {
    await invalidateDomain(occurrenceId, "ims");
  };
}
