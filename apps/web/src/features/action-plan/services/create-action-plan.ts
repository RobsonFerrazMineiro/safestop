import type { CreateActionPlanResult } from "@safestop/types";
import { isActionPlanStatus } from "@safestop/types";
import type { CreateActionPlanInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcData = {
  plan: {
    id: string;
    status: string;
    occurrence_id: string;
    summary?: string | null;
  };
  idempotent?: boolean;
};

export async function createActionPlan(
  input: CreateActionPlanInput,
): Promise<CreateActionPlanResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("create_action_plan", {
    p_payload: {
      occurrence_id: input.occurrenceId,
      summary: input.summary,
    },
  });

  if (error) {
    throw new Error("Não foi possível criar o Plano de Ação.");
  }

  const payload = assertActionPlanRpcDataOrThrow<RpcData>(
    data,
    "Não foi possível criar o Plano de Ação.",
  );

  if (!isActionPlanStatus(payload.plan.status)) {
    throw new Error("Resposta inválida ao criar Plano de Ação.");
  }

  return {
    plan: {
      id: payload.plan.id,
      status: payload.plan.status,
      occurrenceId: payload.plan.occurrence_id,
      summary: payload.plan.summary,
    },
    idempotent: payload.idempotent,
  };
}
