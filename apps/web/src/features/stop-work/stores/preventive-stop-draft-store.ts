import { OCCURRENCE_SEVERITIES, type OccurrenceSeverity } from "@safestop/types";
import type { PreventiveStopDraftInput } from "@safestop/validation";

const STORAGE_PREFIX = "safestop:preventiveStopDraft:";
const DRAFT_SCHEMA_VERSION = 1;

const DRAFT_STRING_KEYS = [
  "taskDescription",
  "locationDescription",
  "conditionDescription",
  "immediateActionDescription",
  "areaId",
  "contractId",
  "contractorOrganizationId",
] as const;

type StoredPreventiveStopDraft = {
  version: number;
  updatedAt: string;
  data: PreventiveStopDraftInput;
};

export function getPreventiveStopDraftStorageKey(userId: string, organizationId: string): string {
  return `${STORAGE_PREFIX}${userId}:${organizationId}`;
}

function getLocalStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

function readStorage(key: string): string | null {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): boolean {
  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorage(key: string): void {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    return;
  }
}

function isOccurrenceSeverity(value: unknown): value is OccurrenceSeverity {
  return typeof value === "string" && (OCCURRENCE_SEVERITIES as readonly string[]).includes(value);
}

function parseDraftData(value: unknown): PreventiveStopDraftInput | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const data: PreventiveStopDraftInput = {};

  for (const key of DRAFT_STRING_KEYS) {
    const field = source[key];

    if (typeof field !== "string") {
      continue;
    }

    data[key] = field;
  }

  if (isOccurrenceSeverity(source.severity)) {
    data.severity = source.severity;
  }

  return data;
}

export function parseStoredPreventiveStopDraft(raw: string): PreventiveStopDraftInput | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const envelope = parsed as Partial<StoredPreventiveStopDraft>;

    if (envelope.version !== DRAFT_SCHEMA_VERSION) {
      return null;
    }

    return parseDraftData(envelope.data);
  } catch {
    return null;
  }
}

/**
 * Conteúdo relevante: string não vazia, ou criticidade diferente do default MEDIUM.
 * Prístino (só MEDIUM + strings vazias) não conta — spec 2a.1.
 */
export function hasPreventiveStopDraftContent(draft: PreventiveStopDraftInput): boolean {
  return Object.entries(draft).some(([key, value]) => {
    if (value === undefined || value === null) {
      return false;
    }

    if (key === "severity" && value === "MEDIUM") {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return true;
  });
}

export function getStoredPreventiveStopDraft(
  userId: string,
  organizationId: string,
): PreventiveStopDraftInput | null {
  const raw = readStorage(getPreventiveStopDraftStorageKey(userId, organizationId));

  if (!raw) {
    return null;
  }

  return parseStoredPreventiveStopDraft(raw);
}

export function setStoredPreventiveStopDraft(
  userId: string,
  organizationId: string,
  draft: PreventiveStopDraftInput,
): void {
  if (!hasPreventiveStopDraftContent(draft)) {
    clearStoredPreventiveStopDraft(userId, organizationId);
    return;
  }

  const payload: StoredPreventiveStopDraft = {
    version: DRAFT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    data: draft,
  };

  writeStorage(getPreventiveStopDraftStorageKey(userId, organizationId), JSON.stringify(payload));
}

export function clearStoredPreventiveStopDraft(userId: string, organizationId: string): void {
  removeStorage(getPreventiveStopDraftStorageKey(userId, organizationId));
}
