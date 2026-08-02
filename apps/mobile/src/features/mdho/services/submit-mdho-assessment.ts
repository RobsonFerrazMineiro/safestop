import type { SubmitMdhoAssessmentResult } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapSubmitMdhoResult } from "./map-mdho";
import { parseMdhoRpcError } from "../utils/mdho-errors";

type RpcSubmitResponse = {
  success: boolean;
  data?: Parameters<typeof mapSubmitMdhoResult>[0];
};

export async function submitMdhoAssessment(
  assessmentId: string,
): Promise<SubmitMdhoAssessmentResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });

  if (error) {
    throw new Error("Não foi possível enviar o MDHO.");
  }

  const response = data as RpcSubmitResponse;

  if (!response.success || !response.data) {
    throw parseMdhoRpcError(data, "Não foi possível enviar o MDHO.");
  }

  return mapSubmitMdhoResult(response.data);
}
