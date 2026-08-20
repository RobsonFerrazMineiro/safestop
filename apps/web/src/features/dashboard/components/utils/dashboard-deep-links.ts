/** Deep links canônicos do Dashboard (Sprint 3.2 + S32-FIN). */
import {
  DASHBOARD_ATTENTION,
  DASHBOARD_LIST_FILTER,
  DASHBOARD_LIST_SCOPE,
} from "@/features/stop-work/utils/dashboard-list-params";

function stopWorkQuery(params: Record<string, string>): string {
  const search = new URLSearchParams(params);
  return `/stop-work?${search.toString()}`;
}

export const dashboardDeepLinks = {
  /** Decisão S32-FIN-H01 (a): ocorrências ativas — NOT IN (ENCERRADA, CANCELADA). */
  stopWorkActive: stopWorkQuery({ dashboardFilter: DASHBOARD_LIST_FILTER.active }),
  stopWorkActiveOperational: stopWorkQuery({
    dashboardFilter: DASHBOARD_LIST_FILTER.active,
    dashboardScope: DASHBOARD_LIST_SCOPE.operational,
  }),
  stopWorkPendingEvaluation: stopWorkQuery({
    dashboardFilter: DASHBOARD_LIST_FILTER.pendingEvaluation,
  }),
  stopWorkActiveInterdictions: stopWorkQuery({
    dashboardFilter: DASHBOARD_LIST_FILTER.activeInterdictions,
  }),
  stopWorkAwaitingValidation: stopWorkQuery({
    dashboardFilter: DASHBOARD_LIST_FILTER.awaitingValidation,
  }),
  stopWorkOpenActionPlans: stopWorkQuery({
    dashboardFilter: DASHBOARD_LIST_FILTER.openActionPlans,
  }),
  /** Lista operacional padrão (nav) — mantém filtro PP legacy sem querystring. */
  stopWorkAll: "/stop-work",
  stopWorkOccurrence: (occurrenceId: string) => `/stop-work/${occurrenceId}`,
  /** S32-FIN-M04: filtro client-side existente no centro de notificações. */
  notificationsPendingAwareness: "/notifications?filter=pending-awareness",
  mdhoApprovals: "/approvals/mdho",
  /** S32-FIN-H02: mesma regra de getActionItemsAttention. */
  actionItemsOverdue: stopWorkQuery({ dashboardAttention: DASHBOARD_ATTENTION.overdue }),
  actionItemsDueSoon: stopWorkQuery({ dashboardAttention: DASHBOARD_ATTENTION.dueSoon }),
} as const;
