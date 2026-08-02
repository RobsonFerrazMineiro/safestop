import { useMutation } from "@tanstack/react-query";

import { saveMdhoDraft } from "../services/save-mdho-draft";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useSaveMdhoDraft(occurrenceId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  const mutation = useMutation({
    mutationFn: saveMdhoDraft,
    onSuccess: async () => {
      await invalidateCaches(occurrenceId);
    },
  });

  return {
    saveDraft: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}
