import { useEffect, useRef } from "react";
import { Alert } from "react-native";

import { useActiveWorkspace } from "./use-active-workspace";
import { resolveWorkspaceDeepLink } from "../services/resolve-workspace-deep-link";

type UseWorkspaceOccurrenceDeepLinkOptions = {
  occurrenceId: string | undefined;
  occurrenceWorkspaceId: string | null | undefined;
  isOccurrenceReady: boolean;
  isOccurrenceMissing: boolean;
};

/**
 * Auto-switch idempotente para deep link cross-Workspace autorizado.
 * Fonte: occurrence autorizada pelo servidor — nunca query param / storage.
 */
export function useWorkspaceOccurrenceDeepLink({
  occurrenceId,
  occurrenceWorkspaceId,
  isOccurrenceReady,
  isOccurrenceMissing,
}: UseWorkspaceOccurrenceDeepLinkOptions): {
  isForbiddenWorkspace: boolean;
  isLegacyWithoutWorkspace: boolean;
  isAligningWorkspace: boolean;
} {
  const { activeWorkspace, workspaces, setActiveWorkspace, isLoading } = useActiveWorkspace();
  const switchedForOccurrenceRef = useRef<string | null>(null);

  const decision =
    isOccurrenceReady && !isOccurrenceMissing && occurrenceWorkspaceId !== undefined
      ? resolveWorkspaceDeepLink({
          occurrenceWorkspaceId,
          activeWorkspaceId: activeWorkspace?.id ?? null,
          accessibleWorkspaceIds: workspaces.map((workspace) => workspace.id),
        })
      : null;

  useEffect(() => {
    if (!occurrenceId || !decision || decision.type !== "auto-switch") {
      return;
    }

    if (switchedForOccurrenceRef.current === occurrenceId) {
      return;
    }

    if (activeWorkspace?.id === decision.workspaceId) {
      switchedForOccurrenceRef.current = occurrenceId;
      return;
    }

    switchedForOccurrenceRef.current = occurrenceId;
    setActiveWorkspace(decision.workspaceId);
    Alert.alert("Workspace", "Workspace alterado para exibir esta paralisação.");
  }, [activeWorkspace?.id, decision, occurrenceId, setActiveWorkspace]);

  useEffect(() => {
    switchedForOccurrenceRef.current = null;
  }, [occurrenceId]);

  const isAligningWorkspace =
    decision?.type === "auto-switch" && activeWorkspace?.id !== decision.workspaceId;

  return {
    isForbiddenWorkspace: decision?.type === "forbidden",
    isLegacyWithoutWorkspace: decision?.type === "legacy-null",
    isAligningWorkspace: Boolean(isAligningWorkspace) || (isLoading && isOccurrenceReady),
  };
}
