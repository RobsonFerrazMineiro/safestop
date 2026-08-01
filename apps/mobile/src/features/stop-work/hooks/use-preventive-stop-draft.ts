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
  const [isSaving, setIsSaving] = useState(false);
  const draftRef = useRef<PreventiveStopDraftInput>({});
  const hydratedScopeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scopeKey) {
      return;
    }

    if (hydratedScopeRef.current === scopeKey) {
      return;
    }

    let isMounted = true;
    hydratedScopeRef.current = null;

    const hydrateDraft = async () => {
      const storedDraft = await getStoredPreventiveStopDraft(userId!, organizationId!);

      if (!isMounted) {
        return;
      }

      const nextDraft = storedDraft ?? {};
      draftRef.current = nextDraft;
      setDraft(nextDraft);
      setIsHydrated(true);
      hydratedScopeRef.current = scopeKey;
    };

    void hydrateDraft();

    return () => {
      isMounted = false;
    };
  }, [organizationId, scopeKey, userId]);

  const persistDraft = useCallback(
    async (nextDraft: PreventiveStopDraftInput) => {
      if (!userId || !organizationId) {
        return;
      }

      setIsSaving(true);

      try {
        await setStoredPreventiveStopDraft(userId, organizationId, nextDraft);
      } finally {
        setIsSaving(false);
      }
    },
    [organizationId, userId],
  );

  const updateDraft = useCallback(
    (patch: Partial<PreventiveStopDraftInput>) => {
      if (!scopeKey || !isHydrated) {
        return;
      }

      const nextDraft = { ...draftRef.current, ...patch };
      draftRef.current = nextDraft;
      setDraft(nextDraft);
      void persistDraft(nextDraft);
    },
    [isHydrated, persistDraft, scopeKey],
  );

  const replaceDraft = useCallback(
    (nextDraft: PreventiveStopDraftInput) => {
      if (!scopeKey || !isHydrated) {
        return;
      }

      draftRef.current = nextDraft;
      setDraft(nextDraft);
      void persistDraft(nextDraft);
    },
    [isHydrated, persistDraft, scopeKey],
  );

  const clearDraft = useCallback(async () => {
    if (!userId || !organizationId) {
      draftRef.current = {};
      setDraft({});
      setIsHydrated(false);
      hydratedScopeRef.current = null;
      return;
    }

    await clearStoredPreventiveStopDraft(userId, organizationId);
    draftRef.current = {};
    setDraft({});
    setIsHydrated(true);
    hydratedScopeRef.current = scopeKey;
  }, [organizationId, scopeKey, userId]);

  const isDraftReady = scopeKey !== null && isHydrated;

  return {
    draft: isDraftReady ? draft : {},
    updateDraft,
    replaceDraft,
    clearDraft,
    isHydrated: isDraftReady,
    isSaving,
    hasLocalDraft: isDraftReady && hasPreventiveStopDraftContent(draft),
    isReady: isDraftReady,
  };
}
