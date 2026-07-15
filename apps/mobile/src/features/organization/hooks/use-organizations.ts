import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";

import { getUserOrganizations } from "../services/get-user-organizations";
import { ORGANIZATION_QUERY_KEYS } from "../types";

export function useOrganizations() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.list(userId ?? ""),
    queryFn: getUserOrganizations,
    enabled: isAuthenticated && userId !== undefined && !isAuthLoading,
  });

  return {
    organizations: query.data ?? [],
    isLoading: isAuthLoading || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    isSuccess: query.isSuccess,
  };
}
