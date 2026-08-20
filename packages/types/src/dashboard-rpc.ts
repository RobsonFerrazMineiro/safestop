/**
 * Contrato e parsing da RPC `get_dashboard_kpis` (Sprint 3.2 / S32-FIN-M01).
 */

import type {
  DashboardDistributionByStatusFamily,
  DashboardDistributionItem,
  DashboardKpiFilters,
  DashboardKpis,
  DashboardManagerialKpis,
  DashboardOperationalKpis,
  DashboardPersonalKpis,
} from "./dashboard-metrics";

/** Prazo para remover fallback client-side de agregação (S32-FIN-M01). */
export const DASHBOARD_CLIENT_FALLBACK_DEADLINE = "2026-09-15";

export function isDashboardClientFallbackAllowed(referenceDate = new Date()): boolean {
  return referenceDate.getTime() < new Date(DASHBOARD_CLIENT_FALLBACK_DEADLINE).getTime();
}

export type DashboardManagerialKpisRpc = DashboardManagerialKpis & {
  occurrencesByStatusFamily?: DashboardDistributionByStatusFamily | null;
  occurrencesByArea?: DashboardDistributionItem[] | null;
  occurrencesByContractor?: DashboardDistributionItem[] | null;
};

export type DashboardKpisRpcPayload = {
  personal: DashboardPersonalKpis;
  operational: DashboardOperationalKpis;
  managerial: DashboardManagerialKpisRpc;
};

export type DashboardKpisRpcArgs = {
  p_organization_id: string;
  p_due_soon_days: number;
  p_period_start: string | null;
  p_period_end: string | null;
};

export function buildDashboardKpisRpcArgs(
  organizationId: string,
  filters: DashboardKpiFilters = {},
): DashboardKpisRpcArgs {
  return {
    p_organization_id: organizationId,
    p_due_soon_days: filters.dueSoonDays ?? 3,
    p_period_start: filters.period?.startAt ?? null,
    p_period_end: filters.period?.endAt ?? null,
  };
}

type RpcErrorEnvelope = {
  success: false;
  error?: { code?: string; message?: string };
};

function isRpcErrorEnvelope(value: unknown): value is RpcErrorEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as RpcErrorEnvelope).success === false
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readPersonal(value: unknown): DashboardPersonalKpis | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.myPendingActions !== "number" ||
    typeof value.myOverdueActions !== "number" ||
    typeof value.myPendingAwareness !== "number"
  ) {
    return null;
  }

  return {
    myPendingActions: value.myPendingActions,
    myOverdueActions: value.myOverdueActions,
    myPendingAwareness: value.myPendingAwareness,
  };
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "number" ? value : null;
}

function readOperational(value: unknown): DashboardOperationalKpis | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    scopedOpenOccurrences: readNullableNumber(value.scopedOpenOccurrences),
    scopedPendingAwareness: readNullableNumber(value.scopedPendingAwareness),
  };
}

function readDistributionItems(value: unknown): DashboardDistributionItem[] | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const items: DashboardDistributionItem[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    if (
      typeof entry.id !== "string" ||
      typeof entry.label !== "string" ||
      typeof entry.count !== "number"
    ) {
      continue;
    }

    items.push({ id: entry.id, label: entry.label, count: entry.count });
  }

  return items;
}

function readStatusFamily(value: unknown): DashboardDistributionByStatusFamily | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const families = [
    "OPEN_EVALUATION",
    "VER_E_AGIR",
    "INTERDICTED",
    "IN_TREATMENT",
    "AWAITING_VALIDATION",
    "COMPLETED",
    "CANCELLED",
  ] as const;

  const result = {} as DashboardDistributionByStatusFamily;

  for (const family of families) {
    const count = value[family];
    result[family] = typeof count === "number" ? count : 0;
  }

  return result;
}

function readManagerial(value: unknown): DashboardManagerialKpisRpc | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    activeOccurrences: readNullableNumber(value.activeOccurrences),
    pendingEvaluation: readNullableNumber(value.pendingEvaluation),
    activeInterdictions: readNullableNumber(value.activeInterdictions),
    awaitingValidation: readNullableNumber(value.awaitingValidation),
    mdhoPendingApproval: readNullableNumber(value.mdhoPendingApproval),
    overdueActionItems: readNullableNumber(value.overdueActionItems),
    dueSoonActionItems: readNullableNumber(value.dueSoonActionItems),
    openActionPlans: readNullableNumber(value.openActionPlans),
    pendingAwarenessOrg: readNullableNumber(value.pendingAwarenessOrg),
    newOccurrencesInPeriod: readNullableNumber(value.newOccurrencesInPeriod),
    avgEvaluationTimeMinutes: readNullableNumber(value.avgEvaluationTimeMinutes),
    avgReleaseTimeMinutes: readNullableNumber(value.avgReleaseTimeMinutes),
    actionCompletionRate: readNullableNumber(value.actionCompletionRate),
    occurrencesByStatusFamily: readStatusFamily(value.occurrencesByStatusFamily),
    occurrencesByArea: readDistributionItems(value.occurrencesByArea),
    occurrencesByContractor: readDistributionItems(value.occurrencesByContractor),
  };
}

export class DashboardKpisRpcError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "DashboardKpisRpcError";
    this.code = code;
  }
}

export function mapDashboardKpisRpcPayload(raw: unknown): DashboardKpisRpcPayload {
  if (isRpcErrorEnvelope(raw)) {
    throw new DashboardKpisRpcError(
      "Não foi possível carregar os indicadores do dashboard.",
      raw.error?.code,
    );
  }

  if (!isRecord(raw)) {
    throw new DashboardKpisRpcError("Resposta inválida da RPC get_dashboard_kpis.");
  }

  const personal = readPersonal(raw.personal);
  const operational = readOperational(raw.operational);
  const managerial = readManagerial(raw.managerial);

  if (!personal || !operational || !managerial) {
    throw new DashboardKpisRpcError("Resposta incompleta da RPC get_dashboard_kpis.");
  }

  return { personal, operational, managerial };
}

export function toDashboardKpis(payload: DashboardKpisRpcPayload): DashboardKpis {
  const {
    occurrencesByStatusFamily: _statusFamily,
    occurrencesByArea: _byArea,
    occurrencesByContractor: _byContractor,
    ...managerial
  } = payload.managerial;

  return {
    personal: payload.personal,
    operational: payload.operational,
    managerial,
  };
}

export type DashboardDistributionFromRpc = {
  byStatusFamily: DashboardDistributionByStatusFamily | null;
  byArea: DashboardDistributionItem[] | null;
};

export function extractDashboardDistributionFromRpc(
  payload: DashboardKpisRpcPayload,
): DashboardDistributionFromRpc {
  return {
    byStatusFamily: payload.managerial.occurrencesByStatusFamily ?? null,
    byArea: payload.managerial.occurrencesByArea ?? null,
  };
}

export function isDashboardKpisRpcUnavailableError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  const code = typeof error.code === "string" ? error.code : "";

  return code === "PGRST202" || code === "42883";
}
