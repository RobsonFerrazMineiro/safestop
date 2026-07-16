import { deleteSecureItem, getSecureItem, setSecureItem } from "@/lib/secure-storage";

const STORAGE_PREFIX = "safestop:activeOrganization:";

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export async function getStoredActiveOrganizationId(userId: string): Promise<string | null> {
  return getSecureItem(getStorageKey(userId));
}

export async function setStoredActiveOrganizationId(
  userId: string,
  organizationId: string,
): Promise<void> {
  await setSecureItem(getStorageKey(userId), organizationId);
}

export async function clearActiveOrganizationStorage(userId: string): Promise<void> {
  await deleteSecureItem(getStorageKey(userId));
}
