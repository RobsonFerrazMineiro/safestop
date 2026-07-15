import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { PermissionCode } from "@safestop/types";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useAuth } from "@/hooks/use-auth";

import { clearAuthorizationCache } from "../services/clear-authorization-cache";
import { getEffectiveAuthorization } from "../services/get-effective-authorization";
import { AuthorizationContext } from "./authorization-context";
import type { AuthorizationContextValue } from "./authorization-context";
import { authorizationQueryKey } from "../types";

type AuthorizationProviderProps = {
  children: ReactNode;
};

const defaultAuthorizationContextValue: AuthorizationContextValue = {
  roles: [],
  permissions: new Set(),
  isPlatformAdmin: false,
  isLoading: false,
  isReady: false,
  isSwitching: false,
  error: null,
  hasNoPermissions: false,
  can: () => false,
  canAny: () => false,
  canAll: () => false,
  refreshAuthorization: async () => undefined,
};

function buildPermissionSet(codes: PermissionCode[]): ReadonlySet<PermissionCode> {
  return new Set(codes);
}

function AuthorizationProviderAuthenticated({ children }: AuthorizationProviderProps) {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    activeOrganization,
    isReady: isOrgReady,
    isLoading: isOrgLoading,
  } = useActiveOrganization();

  const userId = user?.id;
  const organizationId = activeOrganization?.id;
  const previousOrganizationIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const previousOrganizationId = previousOrganizationIdRef.current;

    if (
      previousOrganizationId !== undefined &&
      organizationId !== undefined &&
      previousOrganizationId !== organizationId
    ) {
      clearAuthorizationCache(queryClient);
    }

    previousOrganizationIdRef.current = organizationId;
  }, [organizationId, queryClient]);

  const queryEnabled =
    isOrgReady &&
    userId !== undefined &&
    organizationId !== undefined &&
    activeOrganization !== null;

  const query = useQuery({
    queryKey: authorizationQueryKey(userId ?? "", organizationId ?? ""),
    queryFn: () =>
      getEffectiveAuthorization({
        organizationMemberId: activeOrganization!.organizationMemberId,
        membershipType: activeOrganization!.membershipType,
      }),
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const permissions = useMemo(
    () => buildPermissionSet(query.data?.permissions ?? []),
    [query.data?.permissions],
  );

  const isPlatformAdmin = query.data?.isPlatformAdmin ?? false;
  const isSwitching = queryEnabled && query.isFetching;

  const can = useCallback(
    (code: PermissionCode): boolean => {
      if (!isOrgReady || query.isLoading || query.isFetching || query.isError) {
        return false;
      }

      if (isPlatformAdmin) {
        return true;
      }

      if (!activeOrganization) {
        return false;
      }

      return permissions.has(code);
    },
    [
      activeOrganization,
      isOrgReady,
      isPlatformAdmin,
      permissions,
      query.isError,
      query.isFetching,
      query.isLoading,
    ],
  );

  const canAny = useCallback(
    (codes: PermissionCode[]): boolean => codes.some((code) => can(code)),
    [can],
  );

  const canAll = useCallback(
    (codes: PermissionCode[]): boolean => codes.every((code) => can(code)),
    [can],
  );

  const refreshAuthorization = useCallback(async () => {
    if (!userId || !organizationId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: authorizationQueryKey(userId, organizationId),
    });
  }, [organizationId, queryClient, userId]);

  const isLoading =
    isAuthLoading || isOrgLoading || (queryEnabled && (query.isLoading || query.isFetching));
  const isReady = isOrgReady && queryEnabled && query.isSuccess && !query.isFetching;
  const hasNoPermissions = isReady && permissions.size === 0 && !isPlatformAdmin;

  const value = useMemo<AuthorizationContextValue>(
    () => ({
      roles: query.data?.roles ?? [],
      permissions,
      isPlatformAdmin,
      isLoading,
      isReady,
      isSwitching,
      error: query.error,
      hasNoPermissions,
      can,
      canAny,
      canAll,
      refreshAuthorization,
    }),
    [
      can,
      canAll,
      canAny,
      hasNoPermissions,
      isLoading,
      isPlatformAdmin,
      isReady,
      isSwitching,
      permissions,
      query.data?.roles,
      query.error,
      refreshAuthorization,
    ],
  );

  return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>;
}

export function AuthorizationProvider({ children }: AuthorizationProviderProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <AuthorizationContext.Provider value={defaultAuthorizationContextValue}>
        {children}
      </AuthorizationContext.Provider>
    );
  }

  return (
    <AuthorizationProviderAuthenticated key={user.id}>
      {children}
    </AuthorizationProviderAuthenticated>
  );
}

export function clearAuthorizationSession(queryClient: ReturnType<typeof useQueryClient>): void {
  clearAuthorizationCache(queryClient);
}
