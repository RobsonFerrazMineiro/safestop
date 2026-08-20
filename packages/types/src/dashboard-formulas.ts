/**
 * Fórmulas canônicas do Dashboard (Sprint 3.2).
 * Referência: docs/decisions/DASHBOARD-DECISIONS.md §17–§18, PO-DASH-4
 * Web e Mobile devem importar daqui — nunca redefinir condições localmente.
 */

import type { ActionItemStatus, ActionPlanStatus } from "./action-plan";
import type { MdhoAssessmentStatus } from "./mdho-assessment";
import type { OccurrenceStatus } from "./occurrence-status";

export const DASHBOARD_DUE_SOON_DAYS_DEFAULT = 3;

export const DASHBOARD_TERMINAL_OCCURRENCE_STATUSES = ["ENCERRADA", "CANCELADA"] as const;

export const DASHBOARD_PENDING_EVALUATION_STATUSES = [
  "PARALISACAO_PREVENTIVA",
  "EM_AVALIACAO",
] as const satisfies readonly OccurrenceStatus[];

export const DASHBOARD_ACTIVE_INTERDICTION_STATUSES = [
  "INTERDICAO_CONFIRMADA",
  "MDHO_EM_PREENCHIMENTO",
  "AGUARDANDO_APROVACAO_HSE",
  "AGUARDANDO_REGISTRO_IMS",
  "EM_TRATATIVA",
  "AGUARDANDO_VALIDACAO",
] as const satisfies readonly OccurrenceStatus[];

export const DASHBOARD_AWAITING_VALIDATION_STATUS = "AGUARDANDO_VALIDACAO" as const;

export const DASHBOARD_OPEN_ACTION_ITEM_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "AWAITING_VALIDATION",
  "REJECTED",
] as const satisfies readonly ActionItemStatus[];

export const DASHBOARD_CLOSED_ACTION_ITEM_STATUSES = [
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly ActionItemStatus[];

export const DASHBOARD_OPEN_ACTION_PLAN_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_VALIDATION",
] as const satisfies readonly ActionPlanStatus[];

export const DASHBOARD_MDHO_PENDING_APPROVAL_STATUS =
  "SUBMITTED" as const satisfies MdhoAssessmentStatus;

export const DASHBOARD_OCCURRENCE_STATUS_FAMILIES = [
  "OPEN_EVALUATION",
  "VER_E_AGIR",
  "INTERDICTED",
  "IN_TREATMENT",
  "AWAITING_VALIDATION",
  "COMPLETED",
  "CANCELLED",
] as const;

export type DashboardOccurrenceStatusFamily = (typeof DASHBOARD_OCCURRENCE_STATUS_FAMILIES)[number];

export const DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS: Record<
  DashboardOccurrenceStatusFamily,
  string
> = {
  OPEN_EVALUATION: "Aberta / Em Avaliação",
  VER_E_AGIR: "Ver e Agir",
  INTERDICTED: "Interditada",
  IN_TREATMENT: "Em Tratativa",
  AWAITING_VALIDATION: "Aguardando Validação",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const OCCURRENCE_STATUS_FAMILY_MAP: Record<OccurrenceStatus, DashboardOccurrenceStatusFamily> = {
  PARALISACAO_PREVENTIVA: "OPEN_EVALUATION",
  EM_AVALIACAO: "OPEN_EVALUATION",
  VER_E_AGIR: "VER_E_AGIR",
  INTERDICAO_CONFIRMADA: "INTERDICTED",
  MDHO_EM_PREENCHIMENTO: "INTERDICTED",
  AGUARDANDO_APROVACAO_HSE: "INTERDICTED",
  AGUARDANDO_REGISTRO_IMS: "INTERDICTED",
  EM_TRATATIVA: "IN_TREATMENT",
  AGUARDANDO_VALIDACAO: "AWAITING_VALIDATION",
  LIBERADA: "COMPLETED",
  ENCERRADA: "COMPLETED",
  CANCELADA: "CANCELLED",
};

export const DASHBOARD_OCCURRENCE_STATUSES_BY_FAMILY: Record<
  DashboardOccurrenceStatusFamily,
  readonly OccurrenceStatus[]
> = {
  OPEN_EVALUATION: ["PARALISACAO_PREVENTIVA", "EM_AVALIACAO"],
  VER_E_AGIR: ["VER_E_AGIR"],
  INTERDICTED: [
    "INTERDICAO_CONFIRMADA",
    "MDHO_EM_PREENCHIMENTO",
    "AGUARDANDO_APROVACAO_HSE",
    "AGUARDANDO_REGISTRO_IMS",
  ],
  IN_TREATMENT: ["EM_TRATATIVA"],
  AWAITING_VALIDATION: ["AGUARDANDO_VALIDACAO"],
  COMPLETED: ["LIBERADA", "ENCERRADA"],
  CANCELLED: ["CANCELADA"],
};

export function getOccurrenceStatusFamily(
  status: OccurrenceStatus,
): DashboardOccurrenceStatusFamily {
  return OCCURRENCE_STATUS_FAMILY_MAP[status];
}

export function isActiveOccurrence(status: OccurrenceStatus): boolean {
  return !(DASHBOARD_TERMINAL_OCCURRENCE_STATUSES as readonly string[]).includes(status);
}

export function isPendingEvaluationOccurrence(status: OccurrenceStatus): boolean {
  return (DASHBOARD_PENDING_EVALUATION_STATUSES as readonly string[]).includes(status);
}

export function isActiveInterdictionOccurrence(status: OccurrenceStatus): boolean {
  return (DASHBOARD_ACTIVE_INTERDICTION_STATUSES as readonly string[]).includes(status);
}

export function isAwaitingValidationOccurrence(status: OccurrenceStatus): boolean {
  return status === DASHBOARD_AWAITING_VALIDATION_STATUS;
}

export function isOpenActionItem(status: ActionItemStatus): boolean {
  return !(DASHBOARD_CLOSED_ACTION_ITEM_STATUSES as readonly string[]).includes(status);
}

export function isMyPendingActionItem(status: ActionItemStatus): boolean {
  return status === "PENDING" || status === "IN_PROGRESS";
}

export function isOverdueActionItem(input: {
  status: ActionItemStatus;
  dueAt: string;
  now?: Date;
}): boolean {
  if (!isOpenActionItem(input.status)) {
    return false;
  }

  const now = input.now ?? new Date();
  return new Date(input.dueAt).getTime() < now.getTime();
}

export function isDueSoonActionItem(
  input: {
    status: ActionItemStatus;
    dueAt: string;
    now?: Date;
  },
  dueSoonDays = DASHBOARD_DUE_SOON_DAYS_DEFAULT,
): boolean {
  if (!isOpenActionItem(input.status)) {
    return false;
  }

  const now = input.now ?? new Date();
  const dueAt = new Date(input.dueAt).getTime();
  const nowMs = now.getTime();
  const thresholdMs = dueSoonDays * 24 * 60 * 60 * 1000;

  return dueAt >= nowMs && dueAt <= nowMs + thresholdMs;
}

export function isOpenActionPlan(status: ActionPlanStatus): boolean {
  return status !== "COMPLETED" && status !== "CANCELLED";
}

export function aggregateOccurrencesByStatusFamily(
  rows: readonly { status: OccurrenceStatus }[],
): Record<DashboardOccurrenceStatusFamily, number> {
  const initial = Object.fromEntries(
    DASHBOARD_OCCURRENCE_STATUS_FAMILIES.map((family) => [family, 0]),
  ) as Record<DashboardOccurrenceStatusFamily, number>;

  for (const row of rows) {
    const family = getOccurrenceStatusFamily(row.status);
    initial[family] += 1;
  }

  return initial;
}

export function computeAverageMinutes(
  rows: readonly { startAt: string; endAt: string }[],
): number | null {
  if (rows.length === 0) {
    return null;
  }

  const totalMinutes = rows.reduce((sum, row) => {
    const diffMs = new Date(row.endAt).getTime() - new Date(row.startAt).getTime();
    return sum + diffMs / 60_000;
  }, 0);

  return Math.round(totalMinutes / rows.length);
}

export function computeActionCompletionRate(completed: number, finished: number): number | null {
  if (finished === 0) {
    return null;
  }

  return Math.round((completed / finished) * 100);
}

export function isWithinPeriod(
  isoTimestamp: string,
  period: { startAt: string; endAt: string },
): boolean {
  const value = new Date(isoTimestamp).getTime();
  return value >= new Date(period.startAt).getTime() && value <= new Date(period.endAt).getTime();
}

export type OrganizationContactScopeRow = {
  areaId: string | null;
  unitId: string | null;
  contractId: string | null;
  managementDepartmentId: string | null;
};

export type OccurrenceScopeRow = {
  areaId: string;
  unitId: string | null;
  contractId: string | null;
  managementDepartmentId: string | null;
};

export function matchesOrganizationContactScope(
  occurrence: OccurrenceScopeRow,
  contact: OrganizationContactScopeRow,
): boolean {
  if (contact.areaId !== null && occurrence.areaId !== contact.areaId) {
    return false;
  }

  if (contact.unitId !== null && occurrence.unitId !== contact.unitId) {
    return false;
  }

  if (contact.contractId !== null && occurrence.contractId !== contact.contractId) {
    return false;
  }

  if (
    contact.managementDepartmentId !== null &&
    occurrence.managementDepartmentId !== contact.managementDepartmentId
  ) {
    return false;
  }

  return true;
}

export function isOccurrenceInAnyContactScope(
  occurrence: OccurrenceScopeRow,
  contacts: readonly OrganizationContactScopeRow[],
): boolean {
  return contacts.some((contact) => matchesOrganizationContactScope(occurrence, contact));
}

export function countNewOccurrencesInPeriod(
  rows: readonly { createdAt: string }[],
  period: { startAt: string; endAt: string },
): number {
  return rows.filter((row) => isWithinPeriod(row.createdAt, period)).length;
}

export function computeAvgEvaluationTimeMinutes(
  rows: readonly { createdAt: string; evaluatedAt: string | null }[],
  period: { startAt: string; endAt: string },
): number | null {
  const eligible = rows.filter(
    (row) => row.evaluatedAt !== null && isWithinPeriod(row.evaluatedAt, period),
  );

  if (eligible.length === 0) {
    return null;
  }

  return computeAverageMinutes(
    eligible.map((row) => ({
      startAt: row.createdAt,
      endAt: row.evaluatedAt as string,
    })),
  );
}

export function computeAvgReleaseTimeMinutes(
  rows: readonly { createdAt: string; stoppedAt: string | null; releasedAt: string | null }[],
  period: { startAt: string; endAt: string },
): number | null {
  const eligible = rows.filter(
    (row) => row.releasedAt !== null && isWithinPeriod(row.releasedAt, period),
  );

  if (eligible.length === 0) {
    return null;
  }

  return computeAverageMinutes(
    eligible.map((row) => ({
      startAt: row.stoppedAt ?? row.createdAt,
      endAt: row.releasedAt as string,
    })),
  );
}

export function computeActionCompletionRateForPeriod(
  rows: readonly { status: ActionItemStatus; completedAt: string | null; updatedAt: string }[],
  period: { startAt: string; endAt: string },
): number | null {
  const finished = rows.filter((row) => {
    if (row.status === "COMPLETED" && row.completedAt) {
      return isWithinPeriod(row.completedAt, period);
    }

    if (row.status === "CANCELLED") {
      return isWithinPeriod(row.updatedAt, period);
    }

    return false;
  });

  const completedCount = finished.filter((row) => row.status === "COMPLETED").length;

  return computeActionCompletionRate(completedCount, finished.length);
}

export function countOccurrencesByStatusFamily(
  rows: readonly { status: OccurrenceStatus }[],
): Record<DashboardOccurrenceStatusFamily, number> {
  return aggregateOccurrencesByStatusFamily(rows);
}

export function countActiveOccurrences(rows: readonly { status: OccurrenceStatus }[]): number {
  return rows.filter((row) => isActiveOccurrence(row.status)).length;
}

export function countPendingEvaluationOccurrences(
  rows: readonly { status: OccurrenceStatus }[],
): number {
  return rows.filter((row) => isPendingEvaluationOccurrence(row.status)).length;
}

export function countActiveInterdictionOccurrences(
  rows: readonly { status: OccurrenceStatus }[],
): number {
  return rows.filter((row) => isActiveInterdictionOccurrence(row.status)).length;
}

export function countAwaitingValidationOccurrences(
  rows: readonly { status: OccurrenceStatus }[],
): number {
  return rows.filter((row) => isAwaitingValidationOccurrence(row.status)).length;
}
