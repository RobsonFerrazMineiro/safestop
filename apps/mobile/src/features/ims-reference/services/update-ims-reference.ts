import type { UpdateImsReferenceResult } from "@safestop/types";
import type { UpdateImsReferenceInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapUpdateImsReferenceResult } from "./map-ims-reference";
import { parseImsReferenceRpcError } from "../utils/ims-reference-errors";

type RpcUpdateResponse = {
  success: boolean;
  data?: Parameters<typeof mapUpdateImsReferenceResult>[0];
};

export async function updateImsReference(
  input: UpdateImsReferenceInput,
): Promise<UpdateImsReferenceResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("update_ims_reference", {
    p_payload: {
      occurrence_id: input.occurrenceId,
      ims_reference_code: input.imsReferenceCode.trim(),
      update_reason: input.updateReason.trim(),
    },
  });

  if (error) {
    throw new Error("Não foi possível corrigir a referência IMS.");
  }

  const response = data as RpcUpdateResponse;

  if (!response.success || !response.data) {
    throw parseImsReferenceRpcError(data, "Não foi possível corrigir a referência IMS.");
  }

  return mapUpdateImsReferenceResult(response.data);
}
