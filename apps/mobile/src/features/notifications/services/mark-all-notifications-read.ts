import {
  assertNotificationRpcDataOrThrow,
  type MarkAllNotificationsReadResult,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

type RpcMarkAllReadData = {
  updated_count: number;
};

export async function markAllNotificationsRead(
  organizationId: string,
): Promise<MarkAllNotificationsReadResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("mark_all_notifications_read", {
    p_organization_id: organizationId,
  });

  if (error) {
    throw new Error("Não foi possível marcar todas as notificações como lidas.");
  }

  const payload = assertNotificationRpcDataOrThrow<RpcMarkAllReadData>(
    data,
    "Não foi possível marcar todas as notificações como lidas.",
  );

  return {
    updatedCount: payload.updated_count,
  };
}
