import type { OccurrenceDraftInput } from "@safestop/validation";
import { deleteSecureItem, getSecureItem, setSecureItem } from "@/lib/secure-storage";

const STORAGE_PREFIX = "safestop:occurrenceDraft:";
const DRAFT_SCHEMA_VERSION = 1;

type StoredOccurrenceDraft = {
  version: number;
  updatedAt: string;
  data: OccurrenceDraftInput;
};

function getStorageKey(userId: string, organizationId: string): string {
  return `${STORAGE_PREFIX}${userId}:${organizationId}`;
}

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

export async function getStoredOccurrenceDraft(
  userId: string,
  organizationId: string,
): Promise<OccurrenceDraftInput | null> {
  const raw = await getSecureItem(getStorageKey(userId, organizationId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredOccurrenceDraft;

    if (parsed.version !== DRAFT_SCHEMA_VERSION || !parsed.data) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export async function setStoredOccurrenceDraft(
  userId: string,
  organizationId: string,
  draft: OccurrenceDraftInput,
): Promise<void> {
  if (!hasDraftContent(draft)) {
    await clearStoredOccurrenceDraft(userId, organizationId);
    return;
  }

  const payload: StoredOccurrenceDraft = {
    version: DRAFT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    data: draft,
  };

  await setSecureItem(getStorageKey(userId, organizationId), JSON.stringify(payload));
}

export async function clearStoredOccurrenceDraft(
  userId: string,
  organizationId: string,
): Promise<void> {
  await deleteSecureItem(getStorageKey(userId, organizationId));
}
