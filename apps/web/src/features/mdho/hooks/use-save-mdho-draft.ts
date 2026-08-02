"use client";

import { useMutation } from "@tanstack/react-query";
import type { SaveMdhoDraftInput } from "@safestop/validation";

import { saveMdhoDraft } from "../services/save-mdho-draft";
import { useInvalidateMdhoCaches } from "./use-invalidate-mdho-caches";

export function useSaveMdhoDraft(occurrenceId: string, organizationId: string) {
  const invalidateCaches = useInvalidateMdhoCaches();

  return useMutation({
    mutationFn: (input: SaveMdhoDraftInput) => saveMdhoDraft(input),
    onSuccess: async () => {
      await invalidateCaches(organizationId, occurrenceId);
    },
  });
}
