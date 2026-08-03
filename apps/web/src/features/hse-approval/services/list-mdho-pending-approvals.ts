import {
  mapListMdhoPendingApprovalsResult,
  type ListMdhoPendingApprovalsResult,
  type MdhoPendingApprovalCursor,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";
import { getRpcErrorMessage, parseRpcEnvelope } from "@/features/occurrences/utils/rpc-error";

type ListMdhoPendingApprovalsRpcResponse = {
  success?: boolean;
  items?: ListMdhoPendingApprovalsResult["items"];
  nextCursor?: {
    submitted_at: string;
    assessment_id: string;
  } | null;
  error?: {
    code?: string;
    message?: string;
  };
};

function toRpcCursor(cursor: MdhoPendingApprovalCursor | null): Record<string, string> | undefined {
  if (!cursor) {
    return undefined;
  }

  return {
    submitted_at: cursor.submittedAt,
    assessment_id: cursor.assessmentId,
  };
}

export async function listMdhoPendingApprovals(
  organizationId: string,
  cursor: MdhoPendingApprovalCursor | null = null,
  limit = 30,
): Promise<ListMdhoPendingApprovalsResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("list_mdho_pending_approvals", {
    p_organization_id: organizationId,
    p_cursor: toRpcCursor(cursor),
    p_limit: limit,
  });

  if (error) {
    throw new Error("Não foi possível carregar a fila de aprovação HSE.");
  }

  const envelope = parseRpcEnvelope(data) as ListMdhoPendingApprovalsRpcResponse;

  if (envelope.success === false) {
    throw new Error(getRpcErrorMessage(envelope.error));
  }

  if (envelope.success !== true || !Array.isArray(envelope.items)) {
    throw new Error("Não foi possível carregar a fila de aprovação HSE.");
  }

  return mapListMdhoPendingApprovalsResult({
    items: envelope.items,
    nextCursor: envelope.nextCursor ?? null,
  });
}
