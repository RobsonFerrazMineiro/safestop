/**
 * Catálogo de métricas do Dashboard (Sprint 3.2).
 * Referência: docs/decisions/DASHBOARD-DECISIONS.md; relatório arquitetural §17–§19
 */

import type { PermissionCode } from "./permission-codes";
import type { DashboardOccurrenceStatusFamily } from "./dashboard-formulas";

export const DASHBOARD_STALE_TIME_MS = 45_000;

export const DASHBOARD_RECENT_OCCURRENCES_LIMIT = 6;

export type DashboardMetricScope = "personal" | "operational" | "managerial";

export type DashboardMetricUnit = "count" | "minutes" | "percent" | "rate";

export type DashboardMetricDefinition = {
  key: string;
  label: string;
  scope: DashboardMetricScope;
  unit: DashboardMetricUnit;
  /** Estoque = sem filtro de período; fluxo = exige período. */
  stock: boolean;
};

export const DASHBOARD_METRIC_CATALOG = {
  myPendingActions: {
    key: "myPendingActions",
    label: "Minhas ações pendentes",
    scope: "personal",
    unit: "count",
    stock: true,
  },
  myOverdueActions: {
    key: "myOverdueActions",
    label: "Minhas ações atrasadas",
    scope: "personal",
    unit: "count",
    stock: true,
  },
  myDueSoonActions: {
    key: "myDueSoonActions",
    label: "Minhas ações próximas do vencimento",
    scope: "personal",
    unit: "count",
    stock: true,
  },
  myPendingAwareness: {
    key: "myPendingAwareness",
    label: "Minhas ciências pendentes",
    scope: "personal",
    unit: "count",
    stock: true,
  },
  scopedOpenOccurrences: {
    key: "scopedOpenOccurrences",
    label: "Ocorrências abertas no meu escopo",
    scope: "operational",
    unit: "count",
    stock: true,
  },
  scopedPendingAwareness: {
    key: "scopedPendingAwareness",
    label: "Ciências pendentes no meu escopo",
    scope: "operational",
    unit: "count",
    stock: true,
  },
  activeOccurrences: {
    key: "activeOccurrences",
    label: "Ocorrências abertas",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  pendingEvaluation: {
    key: "pendingEvaluation",
    label: "Pendentes de avaliação",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  activeInterdictions: {
    key: "activeInterdictions",
    label: "Interdições ativas",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  awaitingValidation: {
    key: "awaitingValidation",
    label: "Aguardando validação",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  mdhoPendingApproval: {
    key: "mdhoPendingApproval",
    label: "MDHO aguardando aprovação",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  overdueActionItems: {
    key: "overdueActionItems",
    label: "Ações em atraso",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  dueSoonActionItems: {
    key: "dueSoonActionItems",
    label: "Ações próximas do vencimento",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  openActionPlans: {
    key: "openActionPlans",
    label: "Planos de ação abertos",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  pendingAwarenessOrg: {
    key: "pendingAwarenessOrg",
    label: "Ciências pendentes (organização)",
    scope: "managerial",
    unit: "count",
    stock: true,
  },
  newOccurrencesInPeriod: {
    key: "newOccurrencesInPeriod",
    label: "Novas ocorrências no período",
    scope: "managerial",
    unit: "count",
    stock: false,
  },
  avgEvaluationTimeMinutes: {
    key: "avgEvaluationTimeMinutes",
    label: "Tempo médio de avaliação",
    scope: "managerial",
    unit: "minutes",
    stock: false,
  },
  avgReleaseTimeMinutes: {
    key: "avgReleaseTimeMinutes",
    label: "Tempo médio de liberação",
    scope: "managerial",
    unit: "minutes",
    stock: false,
  },
  actionCompletionRate: {
    key: "actionCompletionRate",
    label: "Taxa de conclusão de ações",
    scope: "managerial",
    unit: "percent",
    stock: false,
  },
} as const satisfies Record<string, DashboardMetricDefinition>;

export type DashboardMetricKey = keyof typeof DASHBOARD_METRIC_CATALOG;

export type DashboardPeriodFilter = {
  startAt: string;
  endAt: string;
};

export type DashboardKpiFilters = {
  dueSoonDays?: number;
  period?: DashboardPeriodFilter | null;
};

export type DashboardPersonalKpis = {
  myPendingActions: number;
  myOverdueActions: number;
  myDueSoonActions: number;
  myPendingAwareness: number;
};

export type DashboardOperationalKpis = {
  scopedOpenOccurrences: number | null;
  scopedPendingAwareness: number | null;
};

export type DashboardManagerialKpis = {
  activeOccurrences: number | null;
  pendingEvaluation: number | null;
  activeInterdictions: number | null;
  awaitingValidation: number | null;
  mdhoPendingApproval: number | null;
  overdueActionItems: number | null;
  dueSoonActionItems: number | null;
  openActionPlans: number | null;
  pendingAwarenessOrg: number | null;
  newOccurrencesInPeriod: number | null;
  avgEvaluationTimeMinutes: number | null;
  avgReleaseTimeMinutes: number | null;
  actionCompletionRate: number | null;
};

export type DashboardKpis = {
  personal: DashboardPersonalKpis;
  operational: DashboardOperationalKpis;
  managerial: DashboardManagerialKpis;
};

export type DashboardDistributionByStatusFamily = Record<DashboardOccurrenceStatusFamily, number>;

export type DashboardDistributionItem = {
  id: string;
  label: string;
  count: number;
};

export type DashboardActionItemAttentionItem = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  actionPlanId: string;
  occurrenceId: string | null;
};

export type DashboardActionItemsAttention = {
  overdueCount: number | null;
  dueSoonCount: number | null;
  overdueItems: DashboardActionItemAttentionItem[];
  dueSoonItems: DashboardActionItemAttentionItem[];
};

export type DashboardRecentOccurrenceItem = {
  id: string;
  publicCode: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  areaName: string | null;
};

export type DashboardAccessContext = {
  recipientMemberId: string;
  hasOrganizationContactScope: boolean;
  canOccurrenceRead: boolean;
  canReportRead: boolean;
  canMdhoApprove: boolean;
  canMdhoReturn: boolean;
  canActionPlanCreate: boolean;
  canActionPlanManage: boolean;
  canActionPlanValidate: boolean;
};

export function canAccessActionPlanMetrics(access: DashboardAccessContext): boolean {
  return (
    access.canOccurrenceRead ||
    access.canActionPlanCreate ||
    access.canActionPlanManage ||
    access.canActionPlanValidate
  );
}

export function canAccessMdhoPendingApproval(access: DashboardAccessContext): boolean {
  return access.canOccurrenceRead || access.canMdhoApprove || access.canMdhoReturn;
}

export function canAccessOccurrenceMetrics(access: DashboardAccessContext): boolean {
  return access.canOccurrenceRead;
}

export function canAccessOperationalMetrics(access: DashboardAccessContext): boolean {
  return access.hasOrganizationContactScope;
}

export type BuildDashboardAccessContextInput = {
  recipientMemberId: string;
  hasOrganizationContactScope: boolean;
  permissions: ReadonlySet<PermissionCode>;
};

export function buildDashboardAccessContext(
  input: BuildDashboardAccessContextInput,
): DashboardAccessContext {
  const can = (code: PermissionCode) => input.permissions.has(code);

  return {
    recipientMemberId: input.recipientMemberId,
    hasOrganizationContactScope: input.hasOrganizationContactScope,
    canOccurrenceRead: can("occurrence.read"),
    canReportRead: can("report.read"),
    canMdhoApprove: can("mdho.approve"),
    canMdhoReturn: can("mdho.return"),
    canActionPlanCreate: can("action_plan.create"),
    canActionPlanManage: can("action_plan.manage"),
    canActionPlanValidate: can("action_plan.validate"),
  };
}

/** Espelha contrato jsonb de `get_dashboard_kpis`. */
export type DashboardKpisRpcPayload = import("./dashboard-rpc").DashboardKpisRpcPayload;

export type MyActionItemsSummary = {
  myPendingActions: number;
  myOverdueActions: number;
  myDueSoonActions: number;
};

export type MyAwarenessSummary = {
  myPendingAwareness: number;
};

export type OccurrenceKpis = {
  activeOccurrences: number | null;
  activeInterdictions: number | null;
  pendingEvaluation: number | null;
  awaitingValidation: number | null;
};

export type FlowMetrics = {
  newOccurrencesInPeriod: number | null;
  avgEvaluationTimeMinutes: number | null;
  avgReleaseTimeMinutes: number | null;
  actionCompletionRate: number | null;
};
