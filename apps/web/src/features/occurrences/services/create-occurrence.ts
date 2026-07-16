import type { CreateOccurrenceInput } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import type { CreateOccurrenceResult } from "../types";
import { mapCreatedOccurrence } from "../utils/map-occurrence";
import { assertRpcSuccess } from "../utils/rpc-error";

type RpcCreatedOccurrence = {
  id: string;
  public_code: string;
  status: string;
};

function mapInputToRpcPayload(organizationId: string, input: CreateOccurrenceInput) {
  return {
    organization_id: organizationId,
    area_id: input.areaId,
    title: input.title,
    task_description: input.taskDescription,
    location_description: input.locationDescription,
    condition_description: input.conditionDescription,
    immediate_action_description: input.immediateActionDescription,
    severity: input.severity,
    unit_id: input.unitId,
    contract_id: input.contractId,
    contractor_organization_id: input.contractorOrganizationId,
    latitude: input.latitude,
    longitude: input.longitude,
    location_accuracy: input.locationAccuracy,
    occurred_at: input.occurredAt,
  };
}

export async function createOccurrence(
  organizationId: string,
  input: CreateOccurrenceInput,
): Promise<CreateOccurrenceResult> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase.rpc("create_occurrence", {
    payload: mapInputToRpcPayload(organizationId, input),
  });

  if (error) {
    throw new Error("Não foi possível registrar a ocorrência.");
  }

  const created = assertRpcSuccess<RpcCreatedOccurrence>(
    data,
    "Não foi possível registrar a ocorrência.",
  );

  return mapCreatedOccurrence(created);
}
