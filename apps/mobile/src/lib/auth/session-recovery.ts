import type { SupabaseClient } from "@supabase/supabase-js";
import { AppState, type AppStateStatus } from "react-native";

export async function recoverSessionOnForeground(
  supabase: SupabaseClient,
  onInvalidSession: () => Promise<void>,
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    await onInvalidSession();
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await onInvalidSession();
  }
}

export function subscribeToAppStateRecovery(onRecover: () => Promise<void>): () => void {
  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === "active") {
      void onRecover();
    }
  };

  const subscription = AppState.addEventListener("change", handleAppStateChange);

  return () => {
    subscription.remove();
  };
}
