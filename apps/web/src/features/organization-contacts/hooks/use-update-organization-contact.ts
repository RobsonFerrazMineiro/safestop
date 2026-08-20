"use client";

import { useMutation } from "@tanstack/react-query";
import type { UpdateOrganizationContactInput } from "@safestop/types";

import { updateOrganizationContact } from "../services/update-organization-contact";
import { useInvalidateOrganizationContactCaches } from "./use-invalidate-organization-contact-caches";

export function useUpdateOrganizationContact(organizationId: string) {
  const invalidateCaches = useInvalidateOrganizationContactCaches();

  return useMutation({
    mutationFn: (input: UpdateOrganizationContactInput) => updateOrganizationContact(input),
    onSuccess: async () => {
      await invalidateCaches(organizationId);
    },
  });
}
