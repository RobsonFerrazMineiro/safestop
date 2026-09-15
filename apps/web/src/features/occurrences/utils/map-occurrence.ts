import {
  isOccurrenceDecisionType,
  isOccurrenceSeverity,
  isOccurrenceStatus,
  type OccurrenceDecision,
} from "@safestop/types";

import type { OccurrenceDetailsEnriched, OccurrenceSummaryEnriched } from "../types";

type ProfileJoin = {
  full_name: string | null;
};

type AreaJoin = {
  name: string;
};

type OrganizationJoin = {
  name: string;
};

type OccurrenceListRow = {
  id: string;
  public_code: string;
  title: string;
  status: string;
  severity: string;
  created_at: string;
  area_id: string;
  unit_id: string | null;
  contract_id: string | null;
  management_department_id: string | null;
  workspace_id: string | null;
  origin_organization_id?: string | null;
  areas: AreaJoin | AreaJoin[] | null;
  profiles: ProfileJoin | ProfileJoin[] | null;
  contractor_organizations: OrganizationJoin | OrganizationJoin[] | null;
  origin_organizations?: OrganizationJoin | OrganizationJoin[] | null;
};

type OccurrenceDecisionJoin = {
  id: string;
  decision_type: string;
  decision_reason: string | null;
  decided_by: string;
  decided_at: string;
  created_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
};

type OccurrenceDetailRow = OccurrenceListRow & {
  task_description: string;
  location_description: string;
  condition_description: string;
  immediate_action_description: string | null;
  decision_type: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  occurred_at: string;
  stopped_at: string | null;
  organization_id: string;
  origin_organization_id: string | null;
  area_id: string;
  unit_id: string | null;
  contract_id: string | null;
  contractor_organization_id: string | null;
  created_by: string;
  evaluated_at: string | null;
  released_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  ims_reference_code: string | null;
  ims_reference_registered_at: string | null;
  ims_reference_registered_by: string | null;
  ims_reference_updated_at: string | null;
  ims_reference_updated_by: string | null;
  assigned_evaluator_id: string | null;
  evaluator: ProfileJoin | ProfileJoin[] | null;
  ims_registered_by_profile: ProfileJoin | ProfileJoin[] | null;
  ims_updated_by_profile: ProfileJoin | ProfileJoin[] | null;
  occurrence_decisions: OccurrenceDecisionJoin | OccurrenceDecisionJoin[] | null;
};

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapContractorOrganizationName(row: OccurrenceListRow): string | null {
  const contractor = normalizeJoin(row.contractor_organizations);
  return contractor?.name ?? null;
}

function mapOriginOrganizationName(row: OccurrenceListRow): string | null {
  const origin = normalizeJoin(row.origin_organizations);
  return origin?.name ?? null;
}

function mapOccurrenceDecisionEmbed(
  occurrenceId: string,
  value: OccurrenceDecisionJoin | OccurrenceDecisionJoin[] | null,
): OccurrenceDecision | null {
  const row = normalizeJoin(value);

  if (!row?.decision_type || !isOccurrenceDecisionType(row.decision_type)) {
    return null;
  }

  if (!row.decision_reason) {
    return null;
  }

  const profile = normalizeJoin(row.profiles);

  return {
    id: row.id,
    occurrenceId,
    decisionType: row.decision_type,
    decisionReason: row.decision_reason,
    decidedBy: row.decided_by,
    decidedByName: profile?.full_name ?? null,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

function mapSummaryFields(row: OccurrenceListRow): OccurrenceSummaryEnriched | null {
  if (!isOccurrenceStatus(row.status) || !isOccurrenceSeverity(row.severity)) {
    return null;
  }

  const area = normalizeJoin(row.areas);
  const profile = normalizeJoin(row.profiles);

  return {
    id: row.id,
    publicCode: row.public_code,
    title: row.title,
    status: row.status,
    severity: row.severity,
    areaName: area?.name ?? null,
    areaId: row.area_id,
    unitId: row.unit_id,
    contractId: row.contract_id,
    managementDepartmentId: row.management_department_id,
    workspaceId: row.workspace_id ?? null,
    originOrganizationId: row.origin_organization_id ?? null,
    originOrganizationName: mapOriginOrganizationName(row),
    createdAt: row.created_at,
    createdByName: profile?.full_name ?? null,
    contractorOrganizationName: mapContractorOrganizationName(row),
  };
}

export function mapOccurrenceSummaryRow(row: OccurrenceListRow): OccurrenceSummaryEnriched | null {
  return mapSummaryFields(row);
}

export function mapOccurrenceSummaryRows(rows: OccurrenceListRow[]): OccurrenceSummaryEnriched[] {
  return rows
    .map(mapOccurrenceSummaryRow)
    .filter((occurrence): occurrence is OccurrenceSummaryEnriched => occurrence !== null);
}

export function mapOccurrenceDetailRow(row: OccurrenceDetailRow): OccurrenceDetailsEnriched | null {
  const summary = mapSummaryFields(row);

  if (!summary) {
    return null;
  }

  const decisionType =
    row.decision_type && isOccurrenceDecisionType(row.decision_type) ? row.decision_type : null;

  const evaluator = normalizeJoin(row.evaluator);
  const imsRegisteredByProfile = normalizeJoin(row.ims_registered_by_profile);
  const imsUpdatedByProfile = normalizeJoin(row.ims_updated_by_profile);

  return {
    ...summary,
    taskDescription: row.task_description,
    locationDescription: row.location_description,
    conditionDescription: row.condition_description,
    immediateActionDescription: row.immediate_action_description,
    decisionType,
    latitude: row.latitude,
    longitude: row.longitude,
    locationAccuracy: row.location_accuracy,
    occurredAt: row.occurred_at,
    stoppedAt: row.stopped_at,
    organizationId: row.organization_id,
    workspaceId: row.workspace_id ?? null,
    areaId: row.area_id,
    unitId: row.unit_id,
    contractId: row.contract_id,
    contractorOrganizationId: row.contractor_organization_id,
    createdBy: row.created_by,
    evaluatedAt: row.evaluated_at,
    releasedAt: row.released_at,
    closedAt: row.closed_at,
    cancelledAt: row.cancelled_at,
    assignedEvaluatorId: row.assigned_evaluator_id,
    assignedEvaluatorName: evaluator?.full_name ?? null,
    imsReferenceCode: row.ims_reference_code,
    imsReferenceRegisteredAt: row.ims_reference_registered_at,
    imsReferenceRegisteredBy: row.ims_reference_registered_by,
    imsReferenceRegisteredByName: imsRegisteredByProfile?.full_name ?? null,
    imsReferenceUpdatedAt: row.ims_reference_updated_at,
    imsReferenceUpdatedBy: row.ims_reference_updated_by,
    imsReferenceUpdatedByName: imsUpdatedByProfile?.full_name ?? null,
    decision: mapOccurrenceDecisionEmbed(row.id, row.occurrence_decisions),
  };
}

type CreatedOccurrenceRpcData = {
  id: string;
  public_code: string;
  status: string;
};

export function mapCreatedOccurrence(data: CreatedOccurrenceRpcData) {
  return {
    id: data.id,
    publicCode: data.public_code,
    status: data.status,
  };
}

export type { OccurrenceListRow, OccurrenceDetailRow };
