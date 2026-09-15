export const WORKSPACES_QUERY_SCOPE = "workspaces" as const;

export type AccessibleWorkspace = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  /** Empresa contratante administradora do ambiente. Null → sem equipe própria no create. */
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
  refetch: () => void;
};

export function workspaceListQueryKey(userId: string, organizationId: string) {
  return [WORKSPACES_QUERY_SCOPE, "list", userId, organizationId] as const;
}
