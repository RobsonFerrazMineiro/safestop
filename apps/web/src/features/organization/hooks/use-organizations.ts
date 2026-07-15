"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";

import { getUserOrganizations } from "../services/get-user-organizations";
import { organizationListQueryKey } from "../types";

export function useOrganizations() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: organizationListQueryKey(userId ?? "pending"),
    queryFn: getUserOrganizations,
    enabled: isAuthenticated && userId !== undefined && !isAuthLoading,
  });

  return {
    organizations: query.data ?? [],
    isLoading: isAuthLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
