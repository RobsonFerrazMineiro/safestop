import type { OccurrenceDraftInput } from "@safestop/validation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import {
  clearStoredOccurrenceDraft,
  getStoredOccurrenceDraft,
  setStoredOccurrenceDraft,
} from "../stores/occurrence-draft-store";

function hasDraftContent(draft: OccurrenceDraftInput): boolean {
  return Object.values(draft).some((value) => {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return true;
  });
}

export function useOccurrenceDraft() {
  const { user } = useAuth();
  const { activeOrganization, isReady } = useActiveOrganization();

  const userId = user?.id;
  const organizationId = activeOrganization?.id;
  const scopeKey = isReady && userId && organizationId ? `${userId}:${organizationId}` : null;

  const [draft, setDraft] = useState<OccurrenceDraftInput>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const draftRef = useRef<OccurrenceDraftInput>({});
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
      const storedDraft = await getStoredOccurrenceDraft(userId!, organizationId!);

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
    async (nextDraft: OccurrenceDraftInput) => {
      if (!userId || !organizationId) {
        return;
      }

      setIsSaving(true);

      try {
        await setStoredOccurrenceDraft(userId, organizationId, nextDraft);
      } finally {
        setIsSaving(false);
      }
    },
    [organizationId, userId],
  );

  const updateDraft = useCallback(
    (patch: Partial<OccurrenceDraftInput>) => {
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
    (nextDraft: OccurrenceDraftInput) => {
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

    await clearStoredOccurrenceDraft(userId, organizationId);
    draftRef.current = {};
    setDraft({});
    setIsHydrated(false);
    hydratedScopeRef.current = null;
  }, [organizationId, userId]);

  const isDraftReady = scopeKey !== null && isHydrated;

  return {
    draft: isDraftReady ? draft : {},
    updateDraft,
    replaceDraft,
    clearDraft,
    isHydrated: isDraftReady,
    isSaving,
    hasLocalDraft: isDraftReady && hasDraftContent(draft),
    isReady: isDraftReady,
  };
}
