import type { NotificationBadgeCounts } from "../types";

export async function getNotificationBadgeCounts(
  organizationId: string,
  recipientMemberId: string,
): Promise<NotificationBadgeCounts> {
  const { createClient } = await import("@/lib/auth/client");
  const supabase = createClient();

  const [unreadResult, awarenessResult] = await Promise.all([
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

  if (unreadResult.error || awarenessResult.error) {
    throw new Error("Não foi possível carregar o contador de notificações.");
  }

  return {
    unreadCount: unreadResult.count ?? 0,
    pendingAwarenessCount: awarenessResult.count ?? 0,
  };
}
