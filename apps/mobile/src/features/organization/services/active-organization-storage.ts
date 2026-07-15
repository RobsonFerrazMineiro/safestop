import * as SecureStore from "expo-secure-store";

const STORAGE_PREFIX = "safestop:activeOrganization:";

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export async function getStoredActiveOrganizationId(userId: string): Promise<string | null> {
  return SecureStore.getItemAsync(getStorageKey(userId));
}

export async function setStoredActiveOrganizationId(
  userId: string,
  organizationId: string,
): Promise<void> {
  await SecureStore.setItemAsync(getStorageKey(userId), organizationId);
}

export async function clearActiveOrganizationStorage(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(getStorageKey(userId));
}
