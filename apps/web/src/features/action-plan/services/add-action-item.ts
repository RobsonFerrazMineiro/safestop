import { isActionItemStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { AddActionItemInput } from "../types";
import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type RpcData = {
  item: {
    id: string;
    status: string;
    action_plan_id: string;
  };
};

export async function addActionItem(input: AddActionItemInput): Promise<{ itemId: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("add_action_item", {
    p_payload: {
      action_plan_id: input.actionPlanId,
      title: input.title.trim(),
      description: input.description.trim(),
      responsible_member_id: input.responsibleMemberId,
      responsible_organization_id: input.responsibleOrganizationId,
      due_at: input.dueAt,
      priority: input.priority,
    },
  });

  if (error) {
    throw new Error("Não foi possível adicionar a ação.");
  }

  const payload = assertActionPlanRpcDataOrThrow<RpcData>(
    data,
    "Não foi possível adicionar a ação.",
  );

  if (!isActionItemStatus(payload.item.status)) {
    throw new Error("Resposta inválida ao adicionar ação.");
  }

  return { itemId: payload.item.id };
}
