import type { Session } from "@supabase/supabase-js";

import { createClient } from "./client";
import { mapAuthError } from "./errors";

type SignInCredentials = {
  email: string;
  password: string;
};

export async function signInWithPassword(credentials: SignInCredentials): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw mapAuthError(error);
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapAuthError(error);
  }
}

export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
