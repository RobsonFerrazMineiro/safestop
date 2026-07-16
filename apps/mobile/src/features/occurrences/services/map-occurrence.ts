import {
  isOccurrenceDecisionType,
  isOccurrenceSeverity,
  isOccurrenceStatus,
  type OccurrenceDetails,
  type OccurrenceSummary,
} from "@safestop/types";

type AreaJoin = { name: string } | { name: string }[] | null;
type ProfileJoin = { full_name: string | null } | { full_name: string | null }[] | null;

function resolveJoinName<T extends { name?: string; full_name?: string | null }>(
  value: T | T[] | null,
  field: "name" | "full_name",
): string | null {
  if (!value) {
    return null;
  }

  const row = Array.isArray(value) ? value[0] : value;

  if (!row) {
    return null;
  }

  const resolved = field === "name" ? row.name : row.full_name;
  return resolved ?? null;
}

export type OccurrenceSummaryRow = {
  id: string;
  public_code: string;
  title: string;
  status: string;
  severity: string;
  created_at: string;
  areas: AreaJoin;
  profiles: ProfileJoin;
};

export type OccurrenceDetailsRow = OccurrenceSummaryRow & {
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

export function mapOccurrenceSummaryRow(row: OccurrenceSummaryRow): OccurrenceSummary | null {
  if (!isOccurrenceStatus(row.status) || !isOccurrenceSeverity(row.severity)) {
    return null;
  }

  return {
    id: row.id,
    publicCode: row.public_code,
    title: row.title,
    status: row.status,
    severity: row.severity,
    areaName: resolveJoinName(row.areas, "name"),
    createdAt: row.created_at,
    createdByName: resolveJoinName(row.profiles, "full_name"),
  };
}

export function mapOccurrenceDetailsRow(row: OccurrenceDetailsRow): OccurrenceDetails | null {
  const summary = mapOccurrenceSummaryRow(row);

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
