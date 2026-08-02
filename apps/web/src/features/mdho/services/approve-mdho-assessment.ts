import type { ApproveMdhoAssessmentResult } from "@safestop/types";
import { isOccurrenceStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { assertMdhoRpcDataOrThrow } from "../utils/mdho-rpc";

type ApproveMdhoRpcData = {
  assessment: {
    id: string;
    status: "APPROVED";
    approved_at: string;
    approved_by: string;
  };
  occurrence: {
    id: string;
    status: string;
  };
};

export async function approveMdhoAssessment(
  assessmentId: string,
): Promise<ApproveMdhoAssessmentResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("approve_mdho_assessment", {
    p_assessment_id: assessmentId,
  });

  if (error) {
    throw new Error("Não foi possível aprovar a avaliação MDHO.");
  }

  const payload = assertMdhoRpcDataOrThrow<ApproveMdhoRpcData>(
    data,
    "Não foi possível aprovar a avaliação MDHO.",
  );

  if (!isOccurrenceStatus(payload.occurrence.status)) {
    throw new Error("Resposta inválida ao aprovar MDHO.");
  }

  return {
    assessment: {
      id: payload.assessment.id,
      status: payload.assessment.status,
      approvedAt: payload.assessment.approved_at,
      approvedBy: payload.assessment.approved_by,
    },
    occurrence: {
      id: payload.occurrence.id,
      status: payload.occurrence.status,
    },
  };
}
