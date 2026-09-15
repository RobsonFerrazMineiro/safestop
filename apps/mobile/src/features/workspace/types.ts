export const WORKSPACES_QUERY_SCOPE = "workspaces" as const;

export type AccessibleWorkspace = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  ownerOrganizationId: string | null;
};

export type WorkspaceContextValue = {
  workspaces: AccessibleWorkspace[];
  activeWorkspace: AccessibleWorkspace | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  hasMultipleWorkspaces: boolean;
  setActiveWorkspace: (workspaceId: string) => void;
  refresh: () => void;
};

export function workspaceListQueryKey(userId: string, organizationId: string) {
  return [WORKSPACES_QUERY_SCOPE, "list", userId, organizationId] as const;
}

/** Chave conceitual obrigatória (Gate 13D). Persistência física pode sanitizar para SecureStore. */
export function buildActiveWorkspacePreferenceKey(userId: string, organizationId: string): string {
  return `safestop:activeWorkspace:${userId}:${organizationId}`;
}
