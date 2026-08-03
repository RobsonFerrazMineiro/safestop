import type { RegisterImsReferenceResult } from "@safestop/types";
import type { RegisterImsReferenceInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapRegisterImsReferenceResult } from "./map-ims-reference";
import { parseImsReferenceRpcError } from "../utils/ims-reference-errors";

type RpcRegisterResponse = {
  success: boolean;
  data?: Parameters<typeof mapRegisterImsReferenceResult>[0];
};

export async function registerImsReference(
  input: RegisterImsReferenceInput,
): Promise<RegisterImsReferenceResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("register_ims_reference", {
    p_payload: {
      occurrence_id: input.occurrenceId,
      ims_reference_code: input.imsReferenceCode.trim(),
    },
  });

  if (error) {
    throw new Error("Não foi possível registrar a referência IMS.");
  }

  const response = data as RpcRegisterResponse;

  if (!response.success || !response.data) {
    throw parseImsReferenceRpcError(data, "Não foi possível registrar a referência IMS.");
  }

  return mapRegisterImsReferenceResult(response.data);
}
