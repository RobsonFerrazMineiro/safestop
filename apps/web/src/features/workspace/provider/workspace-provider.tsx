"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { useAccessibleWorkspaces } from "../hooks/use-accessible-workspaces";
import {
  clearStoredActiveWorkspaceId,
  getStoredActiveWorkspaceId,
  setStoredActiveWorkspaceId,
} from "../services/active-workspace-storage";
import { clearWorkspaceTenantCache } from "../services/clear-workspace-tenant-cache";
import { resolveActiveWorkspace } from "../services/resolve-active-workspace";
import { WorkspaceContext } from "./workspace-context";
import type { WorkspaceContextValue } from "../types";

type WorkspaceProviderProps = {
  children: ReactNode;
};

type WorkspaceSelection = {
  organizationId: string;
  workspaceId: string;
};

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { activeOrganization } = useActiveOrganization();

  return (
    <WorkspaceProviderInner key={activeOrganization?.id ?? "no-organization"}>
      {children}
    </WorkspaceProviderInner>
  );
}

function WorkspaceProviderInner({ children }: WorkspaceProviderProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();
  const userId = user?.id;
  const organizationId = activeOrganization?.id;
  const { workspaces, isLoading: isWorkspacesLoading, error, refetch } = useAccessibleWorkspaces();
  const [selection, setSelection] = useState<WorkspaceSelection | null>(null);
  const previousWorkspaceIdRef = useRef<string | null>(null);

  const preferredWorkspaceId = useMemo(() => {
    if (selection && organizationId && selection.organizationId === organizationId) {
      return selection.workspaceId;
    }

    if (!userId || !organizationId) {
      return null;
    }

    return getStoredActiveWorkspaceId(userId, organizationId);
  }, [organizationId, selection, userId]);

  const activeWorkspace = useMemo(() => {
    if (!isAuthenticated || !userId || !organizationId) {
      return null;
    }

    return resolveActiveWorkspace(workspaces, preferredWorkspaceId);
  }, [isAuthenticated, organizationId, preferredWorkspaceId, userId, workspaces]);

  useEffect(() => {
    if (!userId || !organizationId || workspaces.length === 0) {
      return;
    }

    const storedWorkspaceId = getStoredActiveWorkspaceId(userId, organizationId);

    if (storedWorkspaceId && !workspaces.some((workspace) => workspace.id === storedWorkspaceId)) {
      clearStoredActiveWorkspaceId(userId, organizationId);
    }
  }, [organizationId, userId, workspaces]);

  useEffect(() => {
    if (!userId || !organizationId || !activeWorkspace) {
      return;
    }

    setStoredActiveWorkspaceId(userId, organizationId, activeWorkspace.id);
  }, [activeWorkspace, organizationId, userId]);

  useEffect(() => {
    previousWorkspaceIdRef.current = activeWorkspace?.id ?? null;
  }, [activeWorkspace?.id]);

  const setActiveWorkspace = useCallback(
    (workspaceId: string) => {
      if (!userId || !organizationId) {
        return;
      }

      const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

      if (!selectedWorkspace) {
        return;
      }

      if (previousWorkspaceIdRef.current === selectedWorkspace.id) {
        return;
      }

      const previousWorkspaceId = previousWorkspaceIdRef.current;

      if (previousWorkspaceId) {
        clearWorkspaceTenantCache(queryClient, organizationId, previousWorkspaceId);
      }

      setStoredActiveWorkspaceId(userId, organizationId, selectedWorkspace.id);
      setSelection({ organizationId, workspaceId: selectedWorkspace.id });
      previousWorkspaceIdRef.current = selectedWorkspace.id;
    },
    [organizationId, queryClient, userId, workspaces],
  );

  const isLoading = isAuthLoading || !isOrgReady || isWorkspacesLoading;
  const isReady = !isLoading && activeWorkspace !== null;
  const hasMultipleWorkspaces = workspaces.length > 1;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      isLoading,
      isReady,
      error:
        error instanceof Error ? error : error ? new Error("Falha ao carregar Workspaces.") : null,
      hasMultipleWorkspaces,
      setActiveWorkspace,
      refetch: () => {
        void refetch();
      },
    }),
    [
      activeWorkspace,
      error,
      hasMultipleWorkspaces,
      isLoading,
      isReady,
      refetch,
      setActiveWorkspace,
      workspaces,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
