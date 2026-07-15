"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

import { useOrganizations } from "../hooks/use-organizations";
import {
  clearStoredActiveOrganizationId,
  getStoredActiveOrganizationId,
  setStoredActiveOrganizationId,
} from "../services/active-organization-storage";
import { clearTenantCache } from "../services/clear-tenant-cache";
import { OrganizationContext } from "./organization-context";
import type { OrganizationContextValue, UserOrganization } from "../types";

type OrganizationProviderProps = {
  children: ReactNode;
};

type OrganizationSelection = {
  userId: string;
  organizationId: string;
};

function resolveActiveOrganization(
  organizations: UserOrganization[],
  userId: string,
  selection: OrganizationSelection | null,
): UserOrganization | null {
  if (organizations.length === 0) {
    return null;
  }

  if (selection?.userId === userId) {
    return (
      organizations.find((organization) => organization.id === selection.organizationId) ?? null
    );
  }

  if (organizations.length === 1) {
    return organizations[0] ?? null;
  }

  const storedOrganizationId = getStoredActiveOrganizationId(userId);

  if (!storedOrganizationId) {
    return null;
  }

  return organizations.find((organization) => organization.id === storedOrganizationId) ?? null;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user } = useAuth();

  return (
    <OrganizationProviderInner key={user?.id ?? "anonymous"}>{children}</OrganizationProviderInner>
  );
}

function OrganizationProviderInner({ children }: OrganizationProviderProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;
  const { organizations, isLoading: isOrganizationsLoading } = useOrganizations();
  const [selection, setSelection] = useState<OrganizationSelection | null>(null);

  const activeOrganization = useMemo(() => {
    if (!isAuthenticated || !userId) {
      return null;
    }

    return resolveActiveOrganization(organizations, userId, selection);
  }, [isAuthenticated, organizations, selection, userId]);

  useEffect(() => {
    if (!userId || organizations.length === 0) {
      return;
    }

    const storedOrganizationId = getStoredActiveOrganizationId(userId);

    if (
      storedOrganizationId &&
      !organizations.some((organization) => organization.id === storedOrganizationId)
    ) {
      clearStoredActiveOrganizationId(userId);
    }
  }, [organizations, userId]);

  useEffect(() => {
    if (!userId || !activeOrganization) {
      return;
    }

    setStoredActiveOrganizationId(userId, activeOrganization.id);
  }, [activeOrganization, userId]);

  const setActiveOrganization = useCallback(
    (organizationId: string) => {
      if (!userId) {
        return;
      }

      const selectedOrganization = organizations.find(
        (organization) => organization.id === organizationId,
      );

      if (!selectedOrganization) {
        return;
      }

      clearTenantCache(queryClient);
      setStoredActiveOrganizationId(userId, selectedOrganization.id);
      setSelection({ userId, organizationId: selectedOrganization.id });
    },
    [organizations, queryClient, userId],
  );

  const isLoading = isAuthLoading || isOrganizationsLoading;
  const isReady = activeOrganization !== null;
  const hasMultipleOrganizations = organizations.length > 1;

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      activeOrganization,
      isLoading,
      isReady,
      hasMultipleOrganizations,
      setActiveOrganization,
    }),
    [
      organizations,
      activeOrganization,
      isLoading,
      isReady,
      hasMultipleOrganizations,
      setActiveOrganization,
    ],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function clearOrganizationSession(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
): void {
  queryClient.removeQueries({ queryKey: ["organizations"] });
  clearTenantCache(queryClient);

  if (userId) {
    clearStoredActiveOrganizationId(userId);
  }
}
