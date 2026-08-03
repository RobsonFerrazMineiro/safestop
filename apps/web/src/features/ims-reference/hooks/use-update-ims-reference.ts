"use client";

import { useMutation } from "@tanstack/react-query";
import { updateImsReferenceSchema, type UpdateImsReferenceInput } from "@safestop/validation";

import { updateImsReference } from "../services/update-ims-reference";
import { useInvalidateImsReferenceCaches } from "./use-invalidate-ims-reference-caches";

export function useUpdateImsReference(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateImsReferenceCaches();

  return useMutation({
    mutationFn: (input: UpdateImsReferenceInput) => {
      const payload = updateImsReferenceSchema.parse(input);
      return updateImsReference(payload);
    },
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
