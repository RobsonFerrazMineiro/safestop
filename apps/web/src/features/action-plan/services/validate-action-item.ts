import type { ValidateActionItemResult } from "@safestop/types";
import { isActionItemStatus } from "@safestop/types";
import type { ValidateActionItemInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcData = {
  item: { id: string; status: string };
};

export async function validateActionItem(
  input: ValidateActionItemInput,
): Promise<ValidateActionItemResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("validate_action_item", {
    p_payload: {
      item_id: input.itemId,
      outcome: input.outcome,
      note: input.note,
    },
  });

  if (error) {
    throw new Error("Não foi possível validar a ação.");
  }

  const payload = assertActionPlanRpcDataOrThrow<RpcData>(data, "Não foi possível validar a ação.");

  if (!isActionItemStatus(payload.item.status)) {
    throw new Error("Resposta inválida ao validar ação.");
  }

  return {
    item: {
      id: payload.item.id,
      status: payload.item.status,
      actionPlanId: "",
    },
  };
}
