import type { CreateActionPlanResult } from "@safestop/types";
import type { CreateActionPlanInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcCreateResponse = {
  plan: {
    id: string;
    status: string;
    occurrence_id: string;
  };
  idempotent?: boolean;
};

export async function createActionPlan(
  input: CreateActionPlanInput,
): Promise<CreateActionPlanResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("create_action_plan", {
    p_payload: {
      occurrence_id: input.occurrenceId,
      summary: input.summary?.trim() || null,
    },
  });

  if (error) {
    throw new Error("Não foi possível criar o Plano de Ação.");
  }

  const result = assertActionPlanRpcDataOrThrow<RpcCreateResponse>(
    data,
    "Não foi possível criar o Plano de Ação.",
  );

  return {
    plan: {
      id: result.plan.id,
      status: result.plan.status as CreateActionPlanResult["plan"]["status"],
      occurrenceId: result.plan.occurrence_id,
      summary: input.summary ?? null,
    },
    idempotent: result.idempotent,
  };
}
