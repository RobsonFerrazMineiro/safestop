import type { OccurrenceListFilters, OccurrenceStatus, PermissionCode } from "@safestop/types";
import {
  DASHBOARD_ACTIVE_INTERDICTION_STATUSES,
  DASHBOARD_AWAITING_VALIDATION_STATUS,
  DASHBOARD_PENDING_EVALUATION_STATUSES,
  DASHBOARD_TERMINAL_OCCURRENCE_STATUSES,
  OCCURRENCE_STATUSES,
} from "@safestop/types";

/** Decisão S32-FIN-H01 (a): filtros alinhados às fórmulas do dashboard-formulas.ts */
export const DASHBOARD_LIST_FILTER = {
  active: "active",
  pendingEvaluation: "pending-evaluation",
  activeInterdictions: "active-interdictions",
  awaitingValidation: "awaiting-validation",
  openActionPlans: "open-action-plans",
} as const;

export type DashboardListFilter =
  (typeof DASHBOARD_LIST_FILTER)[keyof typeof DASHBOARD_LIST_FILTER];

export const DASHBOARD_LIST_SCOPE = {
  operational: "operational",
} as const;

export type DashboardListScope = (typeof DASHBOARD_LIST_SCOPE)[keyof typeof DASHBOARD_LIST_SCOPE];

export const DASHBOARD_ATTENTION = {
  overdue: "overdue",
  dueSoon: "due-soon",
} as const;

export type DashboardAttentionFilter =
  (typeof DASHBOARD_ATTENTION)[keyof typeof DASHBOARD_ATTENTION];

export const DASHBOARD_ACTIVE_OCCURRENCE_STATUSES: OccurrenceStatus[] = OCCURRENCE_STATUSES.filter(
  (status) => !(DASHBOARD_TERMINAL_OCCURRENCE_STATUSES as readonly string[]).includes(status),
);

export type StopWorkListViewParams = {
  dashboardFilter: DashboardListFilter | null;
  dashboardScope: DashboardListScope | null;
  dashboardAttention: DashboardAttentionFilter | null;
  imsReferenceCode: string | null;
};

function parseDashboardFilter(value: string | null): DashboardListFilter | null {
  if (!value) {
    return null;
  }

  return (Object.values(DASHBOARD_LIST_FILTER) as string[]).includes(value)
    ? (value as DashboardListFilter)
    : null;
}

function parseDashboardScope(value: string | null): DashboardListScope | null {
  if (!value) {
    return null;
  }

  return (Object.values(DASHBOARD_LIST_SCOPE) as string[]).includes(value)
    ? (value as DashboardListScope)
    : null;
}

function parseDashboardAttention(value: string | null): DashboardAttentionFilter | null {
  if (!value) {
    return null;
  }

  return (Object.values(DASHBOARD_ATTENTION) as string[]).includes(value)
    ? (value as DashboardAttentionFilter)
    : null;
}

export function parseStopWorkListViewParams(searchParams: URLSearchParams): StopWorkListViewParams {
  const imsReferenceCode = searchParams.get("imsReferenceCode")?.trim() || null;

  return {
    dashboardFilter: parseDashboardFilter(searchParams.get("dashboardFilter")),
    dashboardScope: parseDashboardScope(searchParams.get("dashboardScope")),
    dashboardAttention: parseDashboardAttention(searchParams.get("dashboardAttention")),
    imsReferenceCode: imsReferenceCode && imsReferenceCode.length > 0 ? imsReferenceCode : null,
  };
}

export function occurrenceFiltersForDashboardFilter(
  filter: DashboardListFilter,
): OccurrenceListFilters {
  switch (filter) {
    case DASHBOARD_LIST_FILTER.active:
      return { status: [...DASHBOARD_ACTIVE_OCCURRENCE_STATUSES] };
    case DASHBOARD_LIST_FILTER.pendingEvaluation:
      return { status: [...DASHBOARD_PENDING_EVALUATION_STATUSES] };
    case DASHBOARD_LIST_FILTER.activeInterdictions:
      return { status: [...DASHBOARD_ACTIVE_INTERDICTION_STATUSES] };
    case DASHBOARD_LIST_FILTER.awaitingValidation:
      return { status: [DASHBOARD_AWAITING_VALIDATION_STATUS] };
    case DASHBOARD_LIST_FILTER.openActionPlans:
      return { status: [...DASHBOARD_ACTIVE_OCCURRENCE_STATUSES] };
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function stopWorkListViewTitle(params: StopWorkListViewParams): string {
  if (params.dashboardAttention === DASHBOARD_ATTENTION.overdue) {
    return "Ações vencidas";
  }

  if (params.dashboardAttention === DASHBOARD_ATTENTION.dueSoon) {
    return "Ações próximas do vencimento";
  }

  switch (params.dashboardFilter) {
    case DASHBOARD_LIST_FILTER.active:
      return params.dashboardScope === DASHBOARD_LIST_SCOPE.operational
        ? "Ocorrências abertas no meu escopo"
        : "Ocorrências abertas";
    case DASHBOARD_LIST_FILTER.pendingEvaluation:
      return "Pendentes de avaliação";
    case DASHBOARD_LIST_FILTER.activeInterdictions:
      return "Interdições ativas";
    case DASHBOARD_LIST_FILTER.awaitingValidation:
      return "Aguardando validação";
    case DASHBOARD_LIST_FILTER.openActionPlans:
      return "Planos de ação abertos";
    default:
      return "Paralisações";
  }
}

export function canViewStopWorkDashboardAttention(
  can: (code: PermissionCode) => boolean,
  canAny: (codes: PermissionCode[]) => boolean,
): boolean {
  return (
    canAny(["action_plan.create", "action_plan.manage", "action_plan.validate"]) &&
    can("occurrence.read")
  );
}
