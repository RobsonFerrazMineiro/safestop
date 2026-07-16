import type { SupportedStorage } from "@supabase/supabase-js";

import { deleteSecureItem, getSecureItem, setSecureItem } from "@/lib/secure-storage";

export const secureStoreAdapter: SupportedStorage = {
  getItem: (key: string) => getSecureItem(key),
  setItem: (key: string, value: string) => setSecureItem(key, value),
  removeItem: (key: string) => deleteSecureItem(key),
};
