import { isOccurrenceSeverity, isOccurrenceStatus } from "@safestop/types";
import type { CreateOccurrenceInput } from "@safestop/validation";

import { assertRpcSuccess } from "@/features/evidence/utils/rpc-response";
import { getSupabaseClient } from "@/lib/auth/client";

import type { CreateOccurrenceResult } from "./types";

type CreateOccurrenceParams = {
  organizationId: string;
  input: CreateOccurrenceInput;
};

type RpcCreatedOccurrence = {
  id: string;
  organization_id: string;
  area_id: string;
  unit_id: string | null;
  public_code: string;
  title: string;
  severity: string;
  status: string;
  created_by: string;
  occurred_at: string;
  created_at: string;
};

function mapCreateOccurrenceResult(data: RpcCreatedOccurrence): CreateOccurrenceResult {
  if (!isOccurrenceStatus(data.status) || !isOccurrenceSeverity(data.severity)) {
    throw new Error("Não foi possível registrar a ocorrência.");
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    areaId: data.area_id,
    unitId: data.unit_id,
    publicCode: data.public_code,
    title: data.title,
    severity: data.severity,
    status: data.status,
    createdBy: data.created_by,
    occurredAt: data.occurred_at,
    createdAt: data.created_at,
  };
}

function toRpcPayload(input: CreateOccurrenceInput, organizationId: string) {
  return {
    organization_id: organizationId,
    area_id: input.areaId,
    unit_id: input.unitId ?? null,
    contract_id: input.contractId ?? null,
    contractor_organization_id: input.contractorOrganizationId ?? null,
    title: input.title,
    task_description: input.taskDescription,
    location_description: input.locationDescription,
    condition_description: input.conditionDescription,
    immediate_action_description: input.immediateActionDescription ?? null,
    severity: input.severity,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    location_accuracy: input.locationAccuracy ?? null,
    occurred_at: input.occurredAt ?? undefined,
  };
}

export async function createOccurrence(
  params: CreateOccurrenceParams,
): Promise<CreateOccurrenceResult> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase.rpc("create_occurrence", {
    payload: toRpcPayload(params.input, params.organizationId),
  });

  if (error) {
    throw new Error(error.message || "Não foi possível registrar a ocorrência.");
  }

  const created = assertRpcSuccess<RpcCreatedOccurrence>(
    data,
    "Não foi possível registrar a ocorrência.",
  );

  return mapCreateOccurrenceResult(created);
}
