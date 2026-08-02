import type { SaveMdhoDraftResult } from "@safestop/types";
import { isMdhoAssessmentStatus } from "@safestop/types";
import type { SaveMdhoDraftInput } from "@safestop/validation";
import { saveMdhoDraftSchema } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertMdhoRpcDataOrThrow } from "../utils/mdho-rpc";

type SaveDraftRpcData = {
  assessment_id: string;
  status: string;
  updated_at: string;
};

export async function saveMdhoDraft(input: SaveMdhoDraftInput): Promise<SaveMdhoDraftResult> {
  const validated = saveMdhoDraftSchema.parse(input);

  const supabase = createClient();

  const { data, error } = await supabase.rpc("save_mdho_draft", {
    p_payload: {
      assessment_id: validated.assessmentId,
      selections: validated.selections?.map((selection) => ({
        category_id: selection.categoryId,
        option_id: selection.optionId,
        detail: selection.detail,
      })),
      complement: validated.complement,
      expected_updated_at: validated.expectedUpdatedAt,
    },
  });

  if (error) {
    throw new Error("Não foi possível salvar o rascunho MDHO.");
  }

  const payload = assertMdhoRpcDataOrThrow<SaveDraftRpcData>(
    data,
    "Não foi possível salvar o rascunho MDHO.",
  );

  if (!isMdhoAssessmentStatus(payload.status)) {
    throw new Error("Resposta inválida ao salvar rascunho MDHO.");
  }

  return {
    assessmentId: payload.assessment_id,
    status: payload.status,
    updatedAt: payload.updated_at,
  };
}
