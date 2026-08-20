import type { DashboardAccessContext, MyAwarenessSummary } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

export async function getMyAwarenessSummary(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<MyAwarenessSummary> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("recipient_member_id", access.recipientMemberId)
    .eq("requires_awareness", true)
    .is("awareness_confirmed_at", null);

  if (error) {
    throw new Error("Não foi possível carregar suas ciências pendentes.");
  }

  return { myPendingAwareness: count ?? 0 };
}
