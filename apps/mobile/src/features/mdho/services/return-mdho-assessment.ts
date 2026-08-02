import type { ReturnMdhoAssessmentResult } from "@safestop/types";
import { returnMdhoSchema } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapReturnMdhoResult } from "./map-mdho";
import { parseMdhoRpcError } from "../utils/mdho-errors";

type RpcReturnResponse = {
  success: boolean;
  data?: Parameters<typeof mapReturnMdhoResult>[0];
};

export async function returnMdhoAssessment(input: {
  assessmentId: string;
  returnReason: string;
}): Promise<ReturnMdhoAssessmentResult> {
  const validated = returnMdhoSchema.parse(input);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("return_mdho_assessment", {
    p_payload: {
      assessment_id: validated.assessmentId,
      return_reason: validated.returnReason,
    },
  });

  if (error) {
    throw new Error("Não foi possível devolver o MDHO.");
  }

  const response = data as RpcReturnResponse;

  if (!response.success || !response.data) {
    throw parseMdhoRpcError(data, "Não foi possível devolver o MDHO.");
  }

  return mapReturnMdhoResult(response.data);
}
