import type { PreventiveStopDraftInput } from "@safestop/validation";
import { deleteSecureItem, getSecureItem, setSecureItem } from "@/lib/secure-storage";

const STORAGE_PREFIX = "safestop.preventiveStopDraft.";
const DRAFT_SCHEMA_VERSION = 1;
const DEFAULT_PREVENTIVE_STOP_DRAFT_SEVERITY = "MEDIUM";

const PREVENTIVE_STOP_DRAFT_TEXT_FIELDS = [
  "areaId",
  "locationDescription",
  "taskDescription",
  "conditionDescription",
  "contractorOrganizationId",
  "contractId",
  "immediateActionDescription",
  "unitId",
] as const satisfies readonly (keyof PreventiveStopDraftInput)[];

type StoredPreventiveStopDraft = {
  version: number;
  updatedAt: string;
  data: PreventiveStopDraftInput;
};

function getStorageKey(userId: string, organizationId: string): string {
  return `${STORAGE_PREFIX}${userId}.${organizationId}`;
}

function hasNonEmptyDraftString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDraftContent(draft: PreventiveStopDraftInput): boolean {
  for (const field of PREVENTIVE_STOP_DRAFT_TEXT_FIELDS) {
    if (hasNonEmptyDraftString(draft[field])) {
      return true;
    }
  }

  if (
    draft.severity !== undefined &&
    draft.severity !== null &&
    draft.severity !== DEFAULT_PREVENTIVE_STOP_DRAFT_SEVERITY
  ) {
    return true;
  }

  return false;
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
