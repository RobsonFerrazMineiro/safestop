import {
  assertNotificationRpcDataOrThrow,
  type ConfirmNotificationAwarenessResult,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

type RpcConfirmAwarenessData = {
  notification_id: string;
  awareness_confirmed_at: string;
  idempotent?: boolean;
};

export async function confirmNotificationAwareness(
  notificationId: string,
): Promise<ConfirmNotificationAwarenessResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("confirm_notification_awareness", {
    p_notification_id: notificationId,
  });

  if (error) {
    throw new Error("Não foi possível confirmar a ciência.");
  }

  const payload = assertNotificationRpcDataOrThrow<RpcConfirmAwarenessData>(
    data,
    "Não foi possível confirmar a ciência.",
  );

  return {
    notificationId: payload.notification_id,
    awarenessConfirmedAt: payload.awareness_confirmed_at,
    idempotent: payload.idempotent,
  };
}
