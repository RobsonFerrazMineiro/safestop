import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { clearAuthorizationCache } from "@/features/authorization/services/clear-authorization-cache";

import { useOrganizations } from "../hooks/use-organizations";
import {
  clearActiveOrganizationStorage,
  getStoredActiveOrganizationId,
  setStoredActiveOrganizationId,
} from "../services/active-organization-storage";
import { clearTenantCache } from "../services/clear-tenant-cache";
import type { OrganizationContextValue } from "../types";
import { defaultOrganizationContextValue, OrganizationContext } from "./organization-context";

type OrganizationProviderProps = {
  children: ReactNode;
};

type OrganizationProviderAuthenticatedProps = {
  children: ReactNode;
  userId: string;
};

function OrganizationProviderAuthenticated({
  children,
  userId,
}: OrganizationProviderAuthenticatedProps) {
  const queryClient = useQueryClient();
  const {
    organizations,
    isLoading: isListLoading,
    isFetching,
    refetch,
    isSuccess,
  } = useOrganizations();

  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [hasResolvedActiveOrganization, setHasResolvedActiveOrganization] = useState(false);

  useEffect(() => {
    if (!isSuccess || hasResolvedActiveOrganization) {
      return;
    }

    let isMounted = true;

    const resolveActiveOrganization = async () => {
      if (organizations.length === 0) {
        if (!isMounted) {
          return;
        }

        setActiveOrganizationId(null);
        setHasResolvedActiveOrganization(true);
        return;
      }

      if (organizations.length === 1) {
        const organization = organizations[0];

        if (!organization) {
          return;
        }

        await setStoredActiveOrganizationId(userId, organization.id);

        if (!isMounted) {
          return;
        }

        setActiveOrganizationId(organization.id);
        setHasResolvedActiveOrganization(true);
        return;
      }

      const storedOrganizationId = await getStoredActiveOrganizationId(userId);
      const isStoredOrganizationValid =
        storedOrganizationId !== null &&
        organizations.some((organization) => organization.id === storedOrganizationId);

      if (!isMounted) {
        return;
      }

      if (isStoredOrganizationValid) {
        setActiveOrganizationId(storedOrganizationId);
      } else {
        if (storedOrganizationId) {
          await clearActiveOrganizationStorage(userId);
        }

        setActiveOrganizationId(null);
      }

      setHasResolvedActiveOrganization(true);
    };

    void resolveActiveOrganization();

    return () => {
      isMounted = false;
    };
  }, [hasResolvedActiveOrganization, isSuccess, organizations, userId]);

  useEffect(() => {
    if (!hasResolvedActiveOrganization || !activeOrganizationId) {
      return;
    }

    const isActiveOrganizationStillValid = organizations.some(
      (organization) => organization.id === activeOrganizationId,
    );

    if (!isActiveOrganizationStillValid) {
      void (async () => {
        await clearActiveOrganizationStorage(userId);
        setActiveOrganizationId(null);
      })();
    }
  }, [activeOrganizationId, hasResolvedActiveOrganization, organizations, userId]);

  const activeOrganization = useMemo(
    () => organizations.find((organization) => organization.id === activeOrganizationId) ?? null,
    [organizations, activeOrganizationId],
  );

  const setActiveOrganization = useCallback(
    async (organizationId: string) => {
      const selectedOrganization = organizations.find(
        (organization) => organization.id === organizationId,
      );

      if (!selectedOrganization) {
        return;
      }

      await setStoredActiveOrganizationId(userId, organizationId);
      setActiveOrganizationId(organizationId);
      clearTenantCache(queryClient);
      clearAuthorizationCache(queryClient);
    },
    [organizations, queryClient, userId],
  );

  const refetchOrganizations = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const isLoading = isListLoading || isFetching || !hasResolvedActiveOrganization;

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      activeOrganization,
      isLoading,
      isReady: hasResolvedActiveOrganization && activeOrganization !== null,
      hasMultipleOrganizations: organizations.length > 1,
      hasNoOrganizations: hasResolvedActiveOrganization && organizations.length === 0,
      setActiveOrganization,
      refetchOrganizations,
    }),
    [
      activeOrganization,
      hasResolvedActiveOrganization,
      isLoading,
      organizations,
      refetchOrganizations,
      setActiveOrganization,
    ],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <OrganizationContext.Provider value={defaultOrganizationContextValue}>
        {children}
      </OrganizationContext.Provider>
    );
  }

  return (
    <OrganizationProviderAuthenticated key={user.id} userId={user.id}>
      {children}
    </OrganizationProviderAuthenticated>
  );
}
