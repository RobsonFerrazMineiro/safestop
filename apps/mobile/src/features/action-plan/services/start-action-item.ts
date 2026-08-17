import type { ActionItemSnapshot } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcStartResponse = {
  item: ActionItemSnapshot;
};

export async function startActionItem(itemId: string): Promise<ActionItemSnapshot> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("start_action_item", {
    p_item_id: itemId,
  });

  if (error) {
    throw new Error("Não foi possível iniciar a ação.");
  }

  const result = assertActionPlanRpcDataOrThrow<RpcStartResponse>(
    data,
    "Não foi possível iniciar a ação.",
  );

  return result.item;
}
