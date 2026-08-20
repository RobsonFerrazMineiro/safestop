import type { ConfirmNotificationAwarenessResult } from "@safestop/types";
import { assertNotificationRpcDataOrThrow } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

type RpcData = {
  notification_id: string;
  awareness_confirmed_at: string;
  idempotent?: boolean;
};

export async function confirmNotificationAwareness(
  notificationId: string,
): Promise<ConfirmNotificationAwarenessResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("confirm_notification_awareness", {
    p_notification_id: notificationId,
  });

  if (error) {
    throw new Error("Não foi possível confirmar ciência.");
  }

  const payload = assertNotificationRpcDataOrThrow<RpcData>(
    data,
    "Não foi possível confirmar ciência.",
  );

  return {
    notificationId: payload.notification_id,
    awarenessConfirmedAt: payload.awareness_confirmed_at,
    idempotent: payload.idempotent,
  };
}
