import type { MarkAllNotificationsReadResult } from "@safestop/types";
import { assertNotificationRpcDataOrThrow } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

type RpcData = {
  updated_count: number;
};

export async function markAllNotificationsRead(
  organizationId: string,
): Promise<MarkAllNotificationsReadResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("mark_all_notifications_read", {
    p_organization_id: organizationId,
  });

  if (error) {
    throw new Error("Não foi possível marcar todas as notificações como lidas.");
  }

  const payload = assertNotificationRpcDataOrThrow<RpcData>(
    data,
    "Não foi possível marcar todas as notificações como lidas.",
  );

  return {
    updatedCount: payload.updated_count,
  };
}
