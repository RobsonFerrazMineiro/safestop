import type { PreventiveStopDraftInput } from "@safestop/validation";
import { deleteSecureItem, getSecureItem, setSecureItem } from "@/lib/secure-storage";

const STORAGE_PREFIX = "safestop:preventiveStopDraft:";
const DRAFT_SCHEMA_VERSION = 1;

type StoredPreventiveStopDraft = {
  version: number;
  updatedAt: string;
  data: PreventiveStopDraftInput;
};

function getStorageKey(userId: string, organizationId: string): string {
  return `${STORAGE_PREFIX}${userId}:${organizationId}`;
}

function hasDraftContent(draft: PreventiveStopDraftInput): boolean {
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

export async function getStoredPreventiveStopDraft(
  userId: string,
  organizationId: string,
): Promise<PreventiveStopDraftInput | null> {
  const raw = await getSecureItem(getStorageKey(userId, organizationId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredPreventiveStopDraft;

    if (parsed.version !== DRAFT_SCHEMA_VERSION || !parsed.data) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export async function setStoredPreventiveStopDraft(
  userId: string,
  organizationId: string,
  draft: PreventiveStopDraftInput,
): Promise<void> {
  if (!hasDraftContent(draft)) {
    await clearStoredPreventiveStopDraft(userId, organizationId);
    return;
  }

  const payload: StoredPreventiveStopDraft = {
    version: DRAFT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    data: draft,
  };

  await setSecureItem(getStorageKey(userId, organizationId), JSON.stringify(payload));
}

export async function clearStoredPreventiveStopDraft(
  userId: string,
  organizationId: string,
): Promise<void> {
  await deleteSecureItem(getStorageKey(userId, organizationId));
}

export { hasDraftContent as hasPreventiveStopDraftContent };
