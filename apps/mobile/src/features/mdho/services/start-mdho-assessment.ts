import type { StartMdhoAssessmentResult } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapStartMdhoResult } from "./map-mdho";
import { parseMdhoRpcError } from "../utils/mdho-errors";

type RpcStartResponse = {
  success: boolean;
  data?: Parameters<typeof mapStartMdhoResult>[0];
};

export async function startMdhoAssessment(
  occurrenceId: string,
): Promise<StartMdhoAssessmentResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });

  if (error) {
    throw new Error("Não foi possível iniciar a Avaliação Técnica (MDHO).");
  }

  const response = data as RpcStartResponse;

  if (!response.success || !response.data) {
    throw parseMdhoRpcError(data, "Não foi possível iniciar a Avaliação Técnica (MDHO).");
  }

  return mapStartMdhoResult(response.data);
}
