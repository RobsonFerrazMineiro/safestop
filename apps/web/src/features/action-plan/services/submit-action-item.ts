import type { SubmitActionItemResult } from "@safestop/types";
import { isActionItemStatus } from "@safestop/types";
import type { SubmitActionItemInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcData = {
  item: { id: string; status: string; action_plan_id: string };
};

export async function submitActionItem(
  input: SubmitActionItemInput,
): Promise<SubmitActionItemResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("submit_action_item", {
    p_payload: {
      item_id: input.itemId,
      completion_description: input.completionDescription,
    },
  });

  if (error) {
    throw new Error("Não foi possível concluir a ação.");
  }

  const payload = assertActionPlanRpcDataOrThrow<RpcData>(
    data,
    "Não foi possível concluir a ação.",
  );

  if (!isActionItemStatus(payload.item.status)) {
    throw new Error("Resposta inválida ao concluir ação.");
  }

  return {
    item: {
      id: payload.item.id,
      status: payload.item.status,
      actionPlanId: payload.item.action_plan_id,
    },
  };
}
