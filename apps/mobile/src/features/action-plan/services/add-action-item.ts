import type { ActionItemSnapshot } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import type { AddActionItemInput } from "../types";
import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcAddResponse = {
  item: ActionItemSnapshot;
};

export async function addActionItem(input: AddActionItemInput): Promise<ActionItemSnapshot> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("add_action_item", {
    p_payload: {
      action_plan_id: input.actionPlanId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      responsible_member_id: input.responsibleMemberId,
      due_at: input.dueAt,
      priority: input.priority,
    },
  });

  if (error) {
    throw new Error("Não foi possível adicionar a ação.");
  }

  const result = assertActionPlanRpcDataOrThrow<RpcAddResponse>(
    data,
    "Não foi possível adicionar a ação.",
  );

  return result.item;
}
