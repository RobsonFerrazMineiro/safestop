import { useMutation } from "@tanstack/react-query";

import { updateImsReference } from "../services/update-ims-reference";
import { useInvalidateImsReferenceCaches } from "./use-invalidate-ims-reference-caches";

export function useUpdateImsReference(occurrenceId: string) {
  const invalidateCaches = useInvalidateImsReferenceCaches();

  const mutation = useMutation({
    mutationFn: updateImsReference,
    onSuccess: async () => {
      await invalidateCaches(occurrenceId);
    },
  });

  return {
    updateImsReference: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
