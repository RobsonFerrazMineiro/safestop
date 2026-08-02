import type { ApproveMdhoAssessmentResult } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapApproveMdhoResult } from "./map-mdho";
import { parseMdhoRpcError } from "../utils/mdho-errors";

type RpcApproveResponse = {
  success: boolean;
  data?: Parameters<typeof mapApproveMdhoResult>[0];
};

export async function approveMdhoAssessment(
  assessmentId: string,
): Promise<ApproveMdhoAssessmentResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("approve_mdho_assessment", {
    p_assessment_id: assessmentId,
  });

  if (error) {
    throw new Error("Não foi possível aprovar o MDHO.");
  }

  const response = data as RpcApproveResponse;

  if (!response.success || !response.data) {
    throw parseMdhoRpcError(data, "Não foi possível aprovar o MDHO.");
  }

  return mapApproveMdhoResult(response.data);
}
