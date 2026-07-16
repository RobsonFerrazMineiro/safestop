import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function canUseLocalStorage(): boolean {
  return Platform.OS === "web" && typeof globalThis.localStorage !== "undefined";
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (canUseLocalStorage()) {
    return globalThis.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (canUseLocalStorage()) {
    globalThis.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (canUseLocalStorage()) {
    globalThis.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
