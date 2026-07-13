import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";

type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error("EXPO_PUBLIC_SUPABASE_URL não está definida.");
  }

  if (!publishableKey) {
    throw new Error("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY não está definida.");
  }

  return { url, publishableKey };
}

function createSupabaseClient(): SupabaseClient {
  const { url, publishableKey } = getSupabaseEnv();

  return createClient(url, publishableKey, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();
