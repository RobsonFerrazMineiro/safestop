import type { RegisterImsReferenceResult } from "@safestop/types";
import { isOccurrenceStatus } from "@safestop/types";
import type { RegisterImsReferenceInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertImsReferenceRpcDataOrThrow } from "../utils/ims-rpc";

type RegisterImsRpcData = {
  occurrence: {
    id: string;
    status: string;
    ims_reference_code: string;
    ims_reference_registered_at?: string;
    ims_reference_registered_by?: string;
  };
  idempotent?: boolean;
};

export async function registerImsReference(
  input: RegisterImsReferenceInput,
): Promise<RegisterImsReferenceResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("register_ims_reference", {
    p_payload: {
      occurrence_id: input.occurrenceId,
      ims_reference_code: input.imsReferenceCode.trim(),
    },
  });

  if (error) {
    throw new Error("Não foi possível registrar a referência IMS.");
  }

  const payload = assertImsReferenceRpcDataOrThrow<RegisterImsRpcData>(
    data,
    "Não foi possível registrar a referência IMS.",
  );

  if (!isOccurrenceStatus(payload.occurrence.status)) {
    throw new Error("Resposta inválida ao registrar referência IMS.");
  }

  return {
    occurrence: {
      id: payload.occurrence.id,
      status: payload.occurrence.status,
      imsReferenceCode: payload.occurrence.ims_reference_code,
      imsReferenceRegisteredAt: payload.occurrence.ims_reference_registered_at,
      imsReferenceRegisteredBy: payload.occurrence.ims_reference_registered_by,
    },
    idempotent: payload.idempotent,
  };
}
