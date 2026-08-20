import {
  assertListMyNotificationsResult,
  mapListMyNotificationsResult,
  NOTIFICATION_LIST_DEFAULT_LIMIT,
  type ListMyNotificationsInput,
  type ListMyNotificationsResult,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

export async function listMyNotifications(
  input: ListMyNotificationsInput,
): Promise<ListMyNotificationsResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("list_my_notifications", {
    p_organization_id: input.organizationId,
    p_cursor: input.cursor ?? null,
    p_limit: input.limit ?? NOTIFICATION_LIST_DEFAULT_LIMIT,
  });

  if (error) {
    throw new Error("Não foi possível carregar as notificações.");
  }

  const raw = assertListMyNotificationsResult(data, "Não foi possível carregar as notificações.");

  return mapListMyNotificationsResult(raw);
}
