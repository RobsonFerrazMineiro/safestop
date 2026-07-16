import { isOccurrenceSeverity, isOccurrenceStatus } from "@safestop/types";
import type { CreateOccurrenceInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import type { CreateOccurrenceResult, CreateOccurrenceRpcResponse } from "./types";

type CreateOccurrenceParams = {
  organizationId: string;
  input: CreateOccurrenceInput;
};

function mapCreateOccurrenceResult(
  data: NonNullable<CreateOccurrenceRpcResponse["data"]>,
): CreateOccurrenceResult {
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
    throw new Error("Não foi possível registrar a ocorrência.");
  }

  const response = data as CreateOccurrenceRpcResponse;

  if (!response.success || !response.data) {
    throw new Error("Não foi possível registrar a ocorrência.");
  }

  return mapCreateOccurrenceResult(response.data);
}
