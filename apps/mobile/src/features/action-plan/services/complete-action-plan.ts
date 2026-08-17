import type { CompleteActionPlanResult } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

export async function completeActionPlan(planId: string): Promise<CompleteActionPlanResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("complete_action_plan", {
    p_plan_id: planId,
  });

  if (error) {
    throw new Error("Não foi possível concluir o Plano de Ação.");
  }

  return assertActionPlanRpcDataOrThrow<CompleteActionPlanResult>(
    data,
    "Não foi possível concluir o Plano de Ação.",
  );
}
