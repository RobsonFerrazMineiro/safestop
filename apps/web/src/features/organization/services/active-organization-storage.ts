const STORAGE_KEY_PREFIX = "safestop:activeOrganization";

function buildStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

export function getStoredActiveOrganizationId(userId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(buildStorageKey(userId));
}

export function setStoredActiveOrganizationId(userId: string, organizationId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buildStorageKey(userId), organizationId);
}

export function clearStoredActiveOrganizationId(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(buildStorageKey(userId));
}
