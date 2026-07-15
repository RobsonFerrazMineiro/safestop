import { useEffect } from "react";
import { useRouter, type Href } from "expo-router";
import type { PermissionCode } from "@safestop/types";

import { authRoutes } from "@/lib/auth/routes";

import { useAuthorization } from "./use-authorization";

type UseRequirePermissionOptions = {
  redirectTo?: Href;
};

export function useRequirePermission(
  permission: PermissionCode,
  options: UseRequirePermissionOptions = {},
): void {
  const router = useRouter();
  const { can, isReady, isLoading } = useAuthorization();
  const redirectTo = options.redirectTo ?? authRoutes.forbidden;

  useEffect(() => {
    if (isLoading || !isReady) {
      return;
    }

    if (!can(permission)) {
      router.replace(redirectTo);
    }
  }, [can, isLoading, isReady, permission, redirectTo, router]);
}
