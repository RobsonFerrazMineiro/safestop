import type { ReturnMdhoAssessmentResult } from "@safestop/types";
import { isOccurrenceStatus } from "@safestop/types";
import type { ReturnMdhoInput } from "@safestop/validation";
import { returnMdhoSchema } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertMdhoRpcDataOrThrow } from "../utils/mdho-rpc";

type ReturnMdhoRpcData = {
  assessment: {
    id: string;
    status: "RETURNED";
    returned_at: string;
    returned_by: string;
    return_reason: string;
  };
  occurrence: {
    id: string;
    status: string;
  };
};

export async function returnMdhoAssessment(
  input: ReturnMdhoInput,
): Promise<ReturnMdhoAssessmentResult> {
  const validated = returnMdhoSchema.parse(input);

  const supabase = createClient();

  const { data, error } = await supabase.rpc("return_mdho_assessment", {
    p_payload: {
      assessment_id: validated.assessmentId,
      return_reason: validated.returnReason,
    },
  });

  if (error) {
    throw new Error("Não foi possível devolver a avaliação MDHO.");
  }

  const payload = assertMdhoRpcDataOrThrow<ReturnMdhoRpcData>(
    data,
    "Não foi possível devolver a avaliação MDHO.",
  );

  if (!isOccurrenceStatus(payload.occurrence.status)) {
    throw new Error("Resposta inválida ao devolver MDHO.");
  }

  return {
    assessment: {
      id: payload.assessment.id,
      status: payload.assessment.status,
      returnedAt: payload.assessment.returned_at,
      returnedBy: payload.assessment.returned_by,
      returnReason: payload.assessment.return_reason,
    },
    occurrence: {
      id: payload.occurrence.id,
      status: payload.occurrence.status,
    },
  };
}
