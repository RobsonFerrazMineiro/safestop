import {
  assertListMyNotificationsResult,
  mapListMyNotificationsResult,
  NOTIFICATION_LIST_DEFAULT_LIMIT,
  type ListMyNotificationsInput,
  type ListMyNotificationsResult,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

export async function listMyNotifications(
  params: ListMyNotificationsInput,
): Promise<ListMyNotificationsResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("list_my_notifications", {
    p_organization_id: params.organizationId,
    p_cursor: params.cursor ?? null,
    p_limit: params.limit ?? NOTIFICATION_LIST_DEFAULT_LIMIT,
  });

  if (error) {
    throw new Error("Não foi possível carregar as notificações.");
  }

  const envelope = assertListMyNotificationsResult(
    data,
    "Não foi possível carregar as notificações.",
  );

  return mapListMyNotificationsResult(envelope);
}
