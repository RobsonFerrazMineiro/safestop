"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PermissionCode } from "@safestop/types";

import { useAuthorization } from "./use-authorization";

type UseRequirePermissionOptions = {
  redirectTo?: string;
};

export function useRequirePermission(
  permission: PermissionCode,
  options: UseRequirePermissionOptions = {},
): void {
  const router = useRouter();
  const { can, isReady, isLoading } = useAuthorization();
  const redirectTo = options.redirectTo ?? "/forbidden";

  useEffect(() => {
    if (isLoading || !isReady) {
      return;
    }

    if (!can(permission)) {
      router.replace(redirectTo);
    }
  }, [can, isLoading, isReady, permission, redirectTo, router]);
}
