import type { DashboardAccessContext, MyAwarenessSummary } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { countRows } from "./utils/count-rows";

export async function getMyAwarenessSummary(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<MyAwarenessSummary> {
  const supabase = createClient();

  const myPendingAwareness = await countRows(supabase, "notifications", (query) =>
    query
      .eq("organization_id", organizationId)
      .eq("recipient_member_id", access.recipientMemberId)
      .eq("requires_awareness", true)
      .is("awareness_confirmed_at", null),
  );

  return { myPendingAwareness };
}
