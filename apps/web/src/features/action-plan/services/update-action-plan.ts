import type { UpdateActionPlanInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcData = { plan_id: string };

export async function updateActionPlan(input: UpdateActionPlanInput): Promise<{ planId: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("update_action_plan", {
    p_payload: {
      plan_id: input.planId,
      summary: input.summary,
    },
  });

  if (error) {
    throw new Error("Não foi possível atualizar o Plano de Ação.");
  }

  const payload = assertActionPlanRpcDataOrThrow<RpcData>(
    data,
    "Não foi possível atualizar o Plano de Ação.",
  );

  return { planId: payload.plan_id };
}
