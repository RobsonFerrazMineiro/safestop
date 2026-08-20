export const DASHBOARD_ATTENTION = {
  overdue: "overdue",
  dueSoon: "due-soon",
} as const;

export type DashboardAttentionFilter =
  (typeof DASHBOARD_ATTENTION)[keyof typeof DASHBOARD_ATTENTION];

export function parseDashboardAttention(
  value: string | undefined,
): DashboardAttentionFilter | null {
  if (!value) {
    return null;
  }

  return (Object.values(DASHBOARD_ATTENTION) as string[]).includes(value)
    ? (value as DashboardAttentionFilter)
    : null;
}

export function stopWorkAttentionTitle(attention: DashboardAttentionFilter): string {
  if (attention === DASHBOARD_ATTENTION.overdue) {
    return "Ações vencidas";
  }

  return "Ações próximas do vencimento";
}

export function stopWorkAttentionEmptyMessage(attention: DashboardAttentionFilter): string {
  if (attention === DASHBOARD_ATTENTION.overdue) {
    return "Nenhuma ação vencida.";
  }

  return "Nenhuma ação próxima do vencimento.";
}

export function stopWorkAttentionSubtitle(attention: DashboardAttentionFilter): string {
  if (attention === DASHBOARD_ATTENTION.overdue) {
    return "Ações abertas em atraso conforme o dashboard.";
  }

  return "Ações abertas com vencimento próximo conforme o dashboard.";
}
