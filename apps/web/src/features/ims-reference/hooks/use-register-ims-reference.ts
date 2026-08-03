"use client";

import { useMutation } from "@tanstack/react-query";
import { registerImsReferenceSchema, type RegisterImsReferenceInput } from "@safestop/validation";

import { registerImsReference } from "../services/register-ims-reference";
import { useInvalidateImsReferenceCaches } from "./use-invalidate-ims-reference-caches";

export function useRegisterImsReference(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateImsReferenceCaches();

  return useMutation({
    mutationFn: (input: RegisterImsReferenceInput) => {
      const payload = registerImsReferenceSchema.parse(input);
      return registerImsReference(payload);
    },
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
