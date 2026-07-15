import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { authRoutes } from "@/lib/auth/routes";

import { useActiveOrganization } from "./use-active-organization";

type UseOrganizationGateOptions = {
  enabled?: boolean;
};

export function useOrganizationGate({ enabled = true }: UseOrganizationGateOptions = {}): void {
  const router = useRouter();
  const segments = useSegments();
  const { isLoading, isReady, hasMultipleOrganizations } = useActiveOrganization();

  const currentSegment = segments[1] as string | undefined;
  const isOrganizationsScreen = currentSegment === "organizations";

  useEffect(() => {
    if (!enabled || isLoading || isOrganizationsScreen) {
      return;
    }

    if (!isReady && hasMultipleOrganizations) {
      router.replace(authRoutes.organizations);
    }
  }, [enabled, hasMultipleOrganizations, isLoading, isOrganizationsScreen, isReady, router]);
}
