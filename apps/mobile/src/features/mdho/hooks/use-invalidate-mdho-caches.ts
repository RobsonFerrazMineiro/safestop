import { useInvalidateOccurrenceDomain } from "@/features/occurrences/hooks/use-invalidate-occurrence-domain";

export function useInvalidateMdhoCaches() {
  const invalidateDomain = useInvalidateOccurrenceDomain();

  return async function invalidateMdhoCaches(occurrenceId: string) {
    await invalidateDomain(occurrenceId, "mdho");
  };
}
