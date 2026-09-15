import type { AccessibleWorkspace } from "../types";

/**
 * Resolve o Workspace ativo apenas contra o conjunto autorizado pelo servidor.
 * Preferência de storage nunca autoriza sozinha.
 */
export function resolveActiveWorkspace(
  workspaces: AccessibleWorkspace[],
  preferredWorkspaceId: string | null,
): AccessibleWorkspace | null {
  if (workspaces.length === 0) {
    return null;
  }

  if (workspaces.length === 1) {
    return workspaces[0] ?? null;
  }

  if (!preferredWorkspaceId) {
    return null;
  }

  return workspaces.find((workspace) => workspace.id === preferredWorkspaceId) ?? null;
}
