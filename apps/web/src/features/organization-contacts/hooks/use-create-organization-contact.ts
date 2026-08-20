"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateOrganizationContactInput } from "@safestop/types";

import { createOrganizationContact } from "../services/create-organization-contact";
import { useInvalidateOrganizationContactCaches } from "./use-invalidate-organization-contact-caches";

export function useCreateOrganizationContact(organizationId: string) {
  const invalidateCaches = useInvalidateOrganizationContactCaches();

  return useMutation({
    mutationFn: (input: CreateOrganizationContactInput) =>
      createOrganizationContact(organizationId, input),
    onSuccess: async () => {
      await invalidateCaches(organizationId);
    },
  });
}
