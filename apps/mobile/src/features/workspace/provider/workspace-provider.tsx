import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
import type { WorkspaceContextValue } from "../types";
import { WorkspaceContext } from "./workspace-context";

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
  const [storedPreferredId, setStoredPreferredId] = useState<string | null>(null);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const previousWorkspaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPreference = async () => {
      if (!userId || !organizationId) {
        if (isMounted) {
          setStoredPreferredId(null);
          setHasLoadedPreference(true);
        }
        return;
      }

      try {
        const preferredId = await getStoredActiveWorkspaceId(userId, organizationId);
        if (isMounted) {
          setStoredPreferredId(preferredId);
          setHasLoadedPreference(true);
        }
      } catch {
        if (isMounted) {
          setStoredPreferredId(null);
          setHasLoadedPreference(true);
        }
      }
    };

    void loadPreference();

    return () => {
      isMounted = false;
    };
  }, [organizationId, userId]);

  const preferredWorkspaceId = useMemo(() => {
    if (selection && organizationId && selection.organizationId === organizationId) {
      return selection.workspaceId;
    }

    return storedPreferredId;
  }, [organizationId, selection, storedPreferredId]);

  const activeWorkspace = useMemo(() => {
    if (!isAuthenticated || !userId || !organizationId || !hasLoadedPreference) {
      return null;
    }

    return resolveActiveWorkspace(workspaces, preferredWorkspaceId);
  }, [
    hasLoadedPreference,
    isAuthenticated,
    organizationId,
    preferredWorkspaceId,
    userId,
    workspaces,
  ]);

  useEffect(() => {
    if (!userId || !organizationId || workspaces.length === 0 || !hasLoadedPreference) {
      return;
    }

    if (storedPreferredId && !workspaces.some((workspace) => workspace.id === storedPreferredId)) {
      // Preferência revogada: limpa storage. resolveActiveWorkspace já ignora ID inválido.
      void clearStoredActiveWorkspaceId(userId, organizationId).catch(() => undefined);
    }
  }, [hasLoadedPreference, organizationId, storedPreferredId, userId, workspaces]);

  useEffect(() => {
    if (!userId || !organizationId || !activeWorkspace) {
      return;
    }

    void setStoredActiveWorkspaceId(userId, organizationId, activeWorkspace.id).catch(
      () => undefined,
    );
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

      void setStoredActiveWorkspaceId(userId, organizationId, selectedWorkspace.id).catch(
        () => undefined,
      );
      setStoredPreferredId(selectedWorkspace.id);
      setSelection({ organizationId, workspaceId: selectedWorkspace.id });
      previousWorkspaceIdRef.current = selectedWorkspace.id;
    },
    [organizationId, queryClient, userId, workspaces],
  );

  const isLoading =
    isAuthLoading || !isOrgReady || isWorkspacesLoading || (isOrgReady && !hasLoadedPreference);
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
      refresh: () => {
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
