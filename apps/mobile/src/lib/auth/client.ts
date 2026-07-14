import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { secureStoreAdapter } from "./storage";

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

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const { url, publishableKey } = getSupabaseEnv();

    supabaseClient = createClient(url, publishableKey, {
      auth: {
        storage: secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseClient;
}
