import type { StartMdhoAssessmentResult } from "@safestop/types";
import { isMdhoAssessmentStatus, isOccurrenceStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { assertMdhoRpcDataOrThrow } from "../utils/mdho-rpc";

type StartMdhoRpcData = {
  assessment: {
    id: string;
    occurrence_id: string;
    status: string;
    created_at: string;
  };
  occurrence: {
    id: string;
    status: string;
  };
};

export async function startMdhoAssessment(
  occurrenceId: string,
): Promise<StartMdhoAssessmentResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });

  if (error) {
    throw new Error("Não foi possível iniciar a avaliação MDHO.");
  }

  const payload = assertMdhoRpcDataOrThrow<StartMdhoRpcData>(
    data,
    "Não foi possível iniciar a avaliação MDHO.",
  );

  if (
    !isMdhoAssessmentStatus(payload.assessment.status) ||
    !isOccurrenceStatus(payload.occurrence.status)
  ) {
    throw new Error("Resposta inválida ao iniciar MDHO.");
  }

  return {
    assessment: {
      id: payload.assessment.id,
      occurrenceId: payload.assessment.occurrence_id,
      status: payload.assessment.status,
      createdAt: payload.assessment.created_at,
      updatedAt: payload.assessment.created_at,
    },
    occurrence: {
      id: payload.occurrence.id,
      status: payload.occurrence.status,
    },
  };
}
