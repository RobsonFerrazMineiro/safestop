import { isActionItemStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcData = {
  item: { id: string; status: string };
};

export async function startActionItem(itemId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("start_action_item", {
    p_item_id: itemId,
  });

  if (error) {
    throw new Error("Não foi possível iniciar a ação.");
  }

  const payload = assertActionPlanRpcDataOrThrow<RpcData>(data, "Não foi possível iniciar a ação.");

  if (!isActionItemStatus(payload.item.status)) {
    throw new Error("Resposta inválida ao iniciar ação.");
  }
}
