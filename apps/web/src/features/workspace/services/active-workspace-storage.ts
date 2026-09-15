const STORAGE_KEY_PREFIX = "safestop:activeWorkspace";

function buildStorageKey(userId: string, organizationId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}:${organizationId}`;
}

export function getStoredActiveWorkspaceId(userId: string, organizationId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(buildStorageKey(userId, organizationId));
}

export function setStoredActiveWorkspaceId(
  userId: string,
  organizationId: string,
  workspaceId: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buildStorageKey(userId, organizationId), workspaceId);
}

export function clearStoredActiveWorkspaceId(userId: string, organizationId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(buildStorageKey(userId, organizationId));
}
