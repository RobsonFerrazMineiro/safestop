"use client";

import { useMemo } from "react";
import { canManageOrganizationContacts } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";

export function useOrganizationContactsContext() {
  const { can, isPlatformAdmin } = useAuthorization();

  const canManage = useMemo(
    () =>
      canManageOrganizationContacts({
        isPlatformAdmin,
        permissions: { organizationManage: can("organization.manage") },
      }),
    [can, isPlatformAdmin],
  );

  return { canManage };
}
