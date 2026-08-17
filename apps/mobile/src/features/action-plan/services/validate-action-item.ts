import type { ValidateActionItemResult } from "@safestop/types";
import type { ValidateActionItemInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

export async function validateActionItem(
  input: ValidateActionItemInput,
): Promise<ValidateActionItemResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("validate_action_item", {
    p_payload: {
      item_id: input.itemId,
      outcome: input.outcome,
      note: input.note?.trim() || null,
    },
  });

  if (error) {
    throw new Error("Não foi possível validar a ação.");
  }

  return assertActionPlanRpcDataOrThrow<ValidateActionItemResult>(
    data,
    "Não foi possível validar a ação.",
  );
}
