"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useActiveWorkspace } from "../hooks/use-active-workspace";
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
    toast.message("Workspace alterado para o contexto da ocorrência.");
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
