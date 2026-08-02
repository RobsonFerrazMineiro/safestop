import type { SaveMdhoDraftResult } from "@safestop/types";
import { saveMdhoDraftSchema } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapSaveMdhoDraftResult } from "./map-mdho";
import { parseMdhoRpcError } from "../utils/mdho-errors";

type RpcSaveDraftResponse = {
  success: boolean;
  data?: Parameters<typeof mapSaveMdhoDraftResult>[0];
};

export async function saveMdhoDraft(input: {
  assessmentId: string;
  selections?: { categoryId: string; optionId: string; detail?: string }[];
  complement?: string;
  expectedUpdatedAt?: string;
}): Promise<SaveMdhoDraftResult> {
  const validated = saveMdhoDraftSchema.parse(input);
  const supabase = getSupabaseClient();

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

  const response = data as RpcSaveDraftResponse;

  if (!response.success || !response.data) {
    throw parseMdhoRpcError(data, "Não foi possível salvar o rascunho MDHO.");
  }

  return mapSaveMdhoDraftResult(response.data);
}
