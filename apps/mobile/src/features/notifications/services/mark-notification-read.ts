import { assertNotificationRpcDataOrThrow, type MarkNotificationReadResult } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

type RpcMarkReadData = {
  notification_id: string;
  read_at: string;
  idempotent?: boolean;
};

export async function markNotificationRead(
  notificationId: string,
): Promise<MarkNotificationReadResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) {
    throw new Error("Não foi possível marcar a notificação como lida.");
  }

  const payload = assertNotificationRpcDataOrThrow<RpcMarkReadData>(
    data,
    "Não foi possível marcar a notificação como lida.",
  );

  return {
    notificationId: payload.notification_id,
    readAt: payload.read_at,
    idempotent: payload.idempotent,
  };
}
