import { deleteSecureItem, getSecureItem, setSecureItem } from "@/lib/secure-storage";

import { buildActiveWorkspacePreferenceKey } from "../types";

/**
 * SecureStore só aceita [A-Za-z0-9._-]. A chave conceitual usa `:`;
 * a persistência física substitui `:` por `.` sem mudar o contrato conceitual.
 */
function toSecureStoreKey(conceptualKey: string): string {
  return conceptualKey.split(":").join(".");
}

function getStorageKey(userId: string, organizationId: string): string {
  return toSecureStoreKey(buildActiveWorkspacePreferenceKey(userId, organizationId));
}

export async function getStoredActiveWorkspaceId(
  userId: string,
  organizationId: string,
): Promise<string | null> {
  return getSecureItem(getStorageKey(userId, organizationId));
}

export async function setStoredActiveWorkspaceId(
  userId: string,
  organizationId: string,
  workspaceId: string,
): Promise<void> {
  await setSecureItem(getStorageKey(userId, organizationId), workspaceId);
}

export async function clearStoredActiveWorkspaceId(
  userId: string,
  organizationId: string,
): Promise<void> {
  await deleteSecureItem(getStorageKey(userId, organizationId));
}
