import type { PreventiveStopDraftInput } from "@safestop/validation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import {
  clearStoredPreventiveStopDraft,
  getStoredPreventiveStopDraft,
  hasPreventiveStopDraftContent,
  setStoredPreventiveStopDraft,
} from "../stores/preventive-stop-draft-store";

export function usePreventiveStopDraft() {
  const { user } = useAuth();
  const { activeOrganization, isReady } = useActiveOrganization();

  const userId = user?.id;
  const organizationId = activeOrganization?.id;
  const scopeKey = isReady && userId && organizationId ? `${userId}:${organizationId}` : null;

  const [draft, setDraft] = useState<PreventiveStopDraftInput>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const draftRef = useRef<PreventiveStopDraftInput>({});
  const hydratedScopeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scopeKey || !userId || !organizationId) {
      return;
    }

    if (hydratedScopeRef.current === scopeKey) {
      return;
    }

    let storedDraft: PreventiveStopDraftInput | null = null;

    try {
      storedDraft = getStoredPreventiveStopDraft(userId, organizationId);
    } catch {
      storedDraft = null;
    }

    const nextDraft = storedDraft ?? {};
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    setIsHydrated(true);
    hydratedScopeRef.current = scopeKey;
  }, [organizationId, scopeKey, userId]);

  const persistDraft = useCallback(
    (nextDraft: PreventiveStopDraftInput) => {
      if (!userId || !organizationId) {
        return;
      }

      try {
        setStoredPreventiveStopDraft(userId, organizationId, nextDraft);
      } catch {
        return;
      }
    },
    [organizationId, userId],
  );

  const flushDraft = useCallback(
    (nextDraft: PreventiveStopDraftInput) => {
      if (!userId || !organizationId || !scopeKey || !isHydrated) {
        return;
      }

      draftRef.current = nextDraft;
      setDraft(nextDraft);
      persistDraft(nextDraft);
    },
    [isHydrated, organizationId, persistDraft, scopeKey, userId],
  );

  const clearDraft = useCallback(() => {
    if (!userId || !organizationId) {
      draftRef.current = {};
      setDraft({});
      setIsHydrated(false);
      hydratedScopeRef.current = null;
      return;
    }

    try {
      clearStoredPreventiveStopDraft(userId, organizationId);
    } catch {
      // Falha de storage não pode impedir o fluxo principal.
    }
    draftRef.current = {};
    setDraft({});
    setIsHydrated(true);
    hydratedScopeRef.current = scopeKey;
  }, [organizationId, scopeKey, userId]);

  const isDraftReady = scopeKey !== null && isHydrated;

  return {
    draft: isDraftReady ? draft : {},
    flushDraft,
    clearDraft,
    isHydrated: isDraftReady,
    hasLocalDraft: isDraftReady && hasPreventiveStopDraftContent(draft),
    isReady: isDraftReady,
  };
}
