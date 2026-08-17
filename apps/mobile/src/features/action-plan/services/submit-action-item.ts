import type { SubmitActionItemResult } from "@safestop/types";
import type { SubmitActionItemInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

export async function submitActionItem(
  input: SubmitActionItemInput,
): Promise<SubmitActionItemResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("submit_action_item", {
    p_payload: {
      item_id: input.itemId,
      completion_description: input.completionDescription?.trim() || null,
    },
  });

  if (error) {
    throw new Error("Não foi possível concluir a ação.");
  }

  return assertActionPlanRpcDataOrThrow<SubmitActionItemResult>(
    data,
    "Não foi possível concluir a ação.",
  );
}
