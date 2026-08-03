import {
  mapListMdhoPendingApprovalsResult,
  type ListMdhoPendingApprovalsResult,
  type MdhoPendingApprovalCursor,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

type RpcListResponse = {
  success: boolean;
  items?: Parameters<typeof mapListMdhoPendingApprovalsResult>[0]["items"];
  nextCursor?: Parameters<typeof mapListMdhoPendingApprovalsResult>[0]["nextCursor"];
  error?: { code?: string; message?: string };
};

export async function listMdhoPendingApprovals(params: {
  organizationId: string;
  cursor?: MdhoPendingApprovalCursor | null;
  limit?: number;
}): Promise<ListMdhoPendingApprovalsResult> {
  const supabase = getSupabaseClient();

  const pCursor = params.cursor
    ? {
        submitted_at: params.cursor.submittedAt,
        assessment_id: params.cursor.assessmentId,
      }
    : null;

  const { data, error } = await supabase.rpc("list_mdho_pending_approvals", {
    p_organization_id: params.organizationId,
    p_cursor: pCursor,
    p_limit: params.limit ?? 30,
  });

  if (error) {
    throw new Error("Não foi possível carregar a fila de Aprovação HSE.");
  }

  const response = data as RpcListResponse;

  if (!response.success) {
    throw new Error(
      response.error?.message ?? "Não foi possível carregar a fila de Aprovação HSE.",
    );
  }

  return mapListMdhoPendingApprovalsResult({
    items: response.items ?? [],
    nextCursor: response.nextCursor ?? null,
  });
}
