import { getSupabaseClient } from "@/lib/auth/client";

import type { NotificationBadgeCounts } from "../types";

export async function getNotificationBadgeCounts(
  organizationId: string,
  recipientMemberId: string,
): Promise<NotificationBadgeCounts> {
  const supabase = getSupabaseClient();

  const [unreadResult, pendingAwarenessResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("recipient_member_id", recipientMemberId)
      .is("read_at", null),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("recipient_member_id", recipientMemberId)
      .eq("requires_awareness", true)
      .is("awareness_confirmed_at", null),
  ]);

  if (unreadResult.error || pendingAwarenessResult.error) {
    throw new Error("Não foi possível carregar o contador de notificações.");
  }

  return {
    unreadCount: unreadResult.count ?? 0,
    pendingAwarenessCount: pendingAwarenessResult.count ?? 0,
  };
}
