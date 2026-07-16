import {
  isOccurrenceDecisionType,
  isOccurrenceSeverity,
  isOccurrenceStatus,
  type OccurrenceDetails,
  type OccurrenceSummary,
} from "@safestop/types";

type ProfileJoin = {
  full_name: string | null;
};

type AreaJoin = {
  name: string;
};

type OccurrenceListRow = {
  id: string;
  public_code: string;
  title: string;
  status: string;
  severity: string;
  created_at: string;
  areas: AreaJoin | AreaJoin[] | null;
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
  area_id: string;
  unit_id: string | null;
  contract_id: string | null;
  contractor_organization_id: string | null;
  created_by: string;
  evaluated_at: string | null;
  released_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapSummaryFields(row: OccurrenceListRow): OccurrenceSummary | null {
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
    createdAt: row.created_at,
    createdByName: profile?.full_name ?? null,
  };
}

export function mapOccurrenceSummaryRow(row: OccurrenceListRow): OccurrenceSummary | null {
  return mapSummaryFields(row);
}

export function mapOccurrenceSummaryRows(rows: OccurrenceListRow[]): OccurrenceSummary[] {
  return rows
    .map(mapOccurrenceSummaryRow)
    .filter((occurrence): occurrence is OccurrenceSummary => occurrence !== null);
}

export function mapOccurrenceDetailRow(row: OccurrenceDetailRow): OccurrenceDetails | null {
  const summary = mapSummaryFields(row);

  if (!summary) {
    return null;
  }

  const decisionType =
    row.decision_type && isOccurrenceDecisionType(row.decision_type) ? row.decision_type : null;

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
    areaId: row.area_id,
    unitId: row.unit_id,
    contractId: row.contract_id,
    contractorOrganizationId: row.contractor_organization_id,
    createdBy: row.created_by,
    evaluatedAt: row.evaluated_at,
    releasedAt: row.released_at,
    closedAt: row.closed_at,
    cancelledAt: row.cancelled_at,
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
