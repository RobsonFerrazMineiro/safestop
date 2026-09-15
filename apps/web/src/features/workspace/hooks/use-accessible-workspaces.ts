"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getAccessibleWorkspaces } from "../services/get-accessible-workspaces";
import { workspaceListQueryKey } from "../types";

export function useAccessibleWorkspaces() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const userId = user?.id;
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: workspaceListQueryKey(userId ?? "pending", organizationId ?? "pending"),
    queryFn: () => getAccessibleWorkspaces(organizationId!),
    enabled:
      isAuthenticated &&
      !isAuthLoading &&
      isOrgReady &&
      userId !== undefined &&
      organizationId !== undefined,
  });

  return {
    workspaces: query.data ?? [],
    isLoading: isAuthLoading || !isOrgReady || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
