export type WorkspaceDeepLinkDecision =
  | { type: "continue" }
  | { type: "legacy-null" }
  | { type: "auto-switch"; workspaceId: string }
  | { type: "forbidden" };

/**
 * Decide auto-switch de Workspace a partir da occurrence autorizada pelo servidor.
 * Idempotente: se já estiver no Workspace da occurrence, não solicita troca.
 */
export function resolveWorkspaceDeepLink(input: {
  occurrenceWorkspaceId: string | null;
  activeWorkspaceId: string | null;
  accessibleWorkspaceIds: readonly string[];
}): WorkspaceDeepLinkDecision {
  if (input.occurrenceWorkspaceId === null) {
    return { type: "legacy-null" };
  }

  if (!input.accessibleWorkspaceIds.includes(input.occurrenceWorkspaceId)) {
    return { type: "forbidden" };
  }

  if (input.activeWorkspaceId === input.occurrenceWorkspaceId) {
    return { type: "continue" };
  }

  return {
    type: "auto-switch",
    workspaceId: input.occurrenceWorkspaceId,
  };
}
