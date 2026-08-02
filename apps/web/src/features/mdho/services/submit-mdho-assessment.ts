import type { SubmitMdhoAssessmentResult } from "@safestop/types";
import { isOccurrenceStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { assertMdhoRpcDataOrThrow } from "../utils/mdho-rpc";

type SubmitMdhoRpcData = {
  assessment: {
    id: string;
    status: "SUBMITTED";
    submitted_at: string;
    submitted_by: string;
  };
  occurrence: {
    id: string;
    status: string;
  };
};

export async function submitMdhoAssessment(
  assessmentId: string,
): Promise<SubmitMdhoAssessmentResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });

  if (error) {
    throw new Error("Não foi possível enviar a avaliação MDHO.");
  }

  const payload = assertMdhoRpcDataOrThrow<SubmitMdhoRpcData>(
    data,
    "Não foi possível enviar a avaliação MDHO.",
  );

  if (!isOccurrenceStatus(payload.occurrence.status)) {
    throw new Error("Resposta inválida ao enviar MDHO.");
  }

  return {
    assessment: {
      id: payload.assessment.id,
      status: payload.assessment.status,
      submittedAt: payload.assessment.submitted_at,
      submittedBy: payload.assessment.submitted_by,
    },
    occurrence: {
      id: payload.occurrence.id,
      status: payload.occurrence.status,
    },
  };
}
