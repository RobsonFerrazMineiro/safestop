import { getSupabaseClient } from "./client";
import { mapAuthError } from "./errors";
import type { SignInCredentials } from "./types";

export async function signInWithPassword(credentials: SignInCredentials): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw mapAuthError(error);
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapAuthError(error);
  }
}

export async function getSession() {
  const supabase = getSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw mapAuthError(error);
  }

  return session;
}
