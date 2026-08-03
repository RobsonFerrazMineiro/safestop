import type { UpdateImsReferenceResult } from "@safestop/types";
import { isOccurrenceStatus } from "@safestop/types";
import type { UpdateImsReferenceInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertImsReferenceRpcDataOrThrow } from "../utils/ims-rpc";

type UpdateImsRpcData = {
  occurrence: {
    id: string;
    status: string;
    ims_reference_code: string;
    ims_reference_updated_at?: string;
    ims_reference_updated_by?: string;
    previous_ims_reference_code?: string;
  };
};

export async function updateImsReference(
  input: UpdateImsReferenceInput,
): Promise<UpdateImsReferenceResult> {
  const supabase = createClient();

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

  const payload = assertImsReferenceRpcDataOrThrow<UpdateImsRpcData>(
    data,
    "Não foi possível corrigir a referência IMS.",
  );

  if (!isOccurrenceStatus(payload.occurrence.status)) {
    throw new Error("Resposta inválida ao corrigir referência IMS.");
  }

  return {
    occurrence: {
      id: payload.occurrence.id,
      status: payload.occurrence.status,
      imsReferenceCode: payload.occurrence.ims_reference_code,
      imsReferenceUpdatedAt: payload.occurrence.ims_reference_updated_at,
      imsReferenceUpdatedBy: payload.occurrence.ims_reference_updated_by,
      previousImsReferenceCode: payload.occurrence.previous_ims_reference_code,
    },
  };
}
