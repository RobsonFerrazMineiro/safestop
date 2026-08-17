import type { CompleteActionPlanResult } from "@safestop/types";
import { isActionPlanStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcData = {
  plan: { id: string; status: string };
  idempotent?: boolean;
};

export async function completeActionPlan(planId: string): Promise<CompleteActionPlanResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("complete_action_plan", {
    p_plan_id: planId,
  });

  if (error) {
    throw new Error("Não foi possível concluir o Plano de Ação.");
  }

  const payload = assertActionPlanRpcDataOrThrow<RpcData>(
    data,
    "Não foi possível concluir o Plano de Ação.",
  );

  if (!isActionPlanStatus(payload.plan.status)) {
    throw new Error("Resposta inválida ao concluir plano.");
  }

  return {
    plan: {
      id: payload.plan.id,
      status: payload.plan.status,
      occurrenceId: "",
    },
  };
}
