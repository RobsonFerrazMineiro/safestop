import { useMutation } from "@tanstack/react-query";

import { registerImsReference } from "../services/register-ims-reference";
import { useInvalidateImsReferenceCaches } from "./use-invalidate-ims-reference-caches";

export function useRegisterImsReference(occurrenceId: string) {
  const invalidateCaches = useInvalidateImsReferenceCaches();

  const mutation = useMutation({
    mutationFn: registerImsReference,
    onSuccess: async () => {
      await invalidateCaches(occurrenceId);
    },
  });

  return {
    registerImsReference: mutation.mutateAsync,
    isRegistering: mutation.isPending,
    error: mutation.error,
  };
}
