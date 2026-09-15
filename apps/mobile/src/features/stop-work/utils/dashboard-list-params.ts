export const DASHBOARD_ATTENTION = {
  pending: "pending",
  overdue: "overdue",
  dueSoon: "due-soon",
} as const;

export type DashboardAttentionFilter =
  (typeof DASHBOARD_ATTENTION)[keyof typeof DASHBOARD_ATTENTION];

/** Escopo da lista de atenção. Ausente/inválido = organizacional (compatibilidade). */
export const DASHBOARD_ATTENTION_SCOPE = {
  organization: "organization",
  mine: "mine",
} as const;

export type DashboardAttentionScope =
  (typeof DASHBOARD_ATTENTION_SCOPE)[keyof typeof DASHBOARD_ATTENTION_SCOPE];

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

export function parseDashboardAttentionScope(value: string | undefined): DashboardAttentionScope {
  if (value === DASHBOARD_ATTENTION_SCOPE.mine) {
    return DASHBOARD_ATTENTION_SCOPE.mine;
  }

  return DASHBOARD_ATTENTION_SCOPE.organization;
}

export function stopWorkAttentionTitle(
  attention: DashboardAttentionFilter,
  scope: DashboardAttentionScope = DASHBOARD_ATTENTION_SCOPE.organization,
): string {
  if (scope === DASHBOARD_ATTENTION_SCOPE.mine) {
    switch (attention) {
      case DASHBOARD_ATTENTION.pending:
        return "Minhas ações pendentes";
      case DASHBOARD_ATTENTION.overdue:
        return "Minhas ações vencidas";
      case DASHBOARD_ATTENTION.dueSoon:
        return "Minhas ações próximas do vencimento";
    }
  }

  switch (attention) {
    case DASHBOARD_ATTENTION.pending:
      return "Ações pendentes";
    case DASHBOARD_ATTENTION.overdue:
      return "Ações vencidas";
    case DASHBOARD_ATTENTION.dueSoon:
      return "Ações próximas do vencimento";
  }
}

export function stopWorkAttentionEmptyMessage(
  attention: DashboardAttentionFilter,
  scope: DashboardAttentionScope = DASHBOARD_ATTENTION_SCOPE.organization,
): string {
  if (scope === DASHBOARD_ATTENTION_SCOPE.mine) {
    switch (attention) {
      case DASHBOARD_ATTENTION.pending:
        return "Você não possui ações pendentes.";
      case DASHBOARD_ATTENTION.overdue:
        return "Você não possui ações vencidas.";
      case DASHBOARD_ATTENTION.dueSoon:
        return "Você não possui ações próximas do vencimento.";
    }
  }

  switch (attention) {
    case DASHBOARD_ATTENTION.pending:
      return "Nenhuma ação pendente.";
    case DASHBOARD_ATTENTION.overdue:
      return "Nenhuma ação vencida.";
    case DASHBOARD_ATTENTION.dueSoon:
      return "Nenhuma ação próxima do vencimento.";
  }
}

export function stopWorkAttentionSubtitle(
  attention: DashboardAttentionFilter,
  scope: DashboardAttentionScope = DASHBOARD_ATTENTION_SCOPE.organization,
): string {
  if (scope === DASHBOARD_ATTENTION_SCOPE.mine) {
    switch (attention) {
      case DASHBOARD_ATTENTION.pending:
        return "Ações sob sua responsabilidade que ainda estão pendentes ou em andamento.";
      case DASHBOARD_ATTENTION.overdue:
        return "Ações sob sua responsabilidade que estão em atraso.";
      case DASHBOARD_ATTENTION.dueSoon:
        return "Ações sob sua responsabilidade com prazo próximo.";
    }
  }

  switch (attention) {
    case DASHBOARD_ATTENTION.pending:
      return "Ações abertas pendentes ou em andamento conforme o dashboard.";
    case DASHBOARD_ATTENTION.overdue:
      return "Ações abertas em atraso conforme o dashboard.";
    case DASHBOARD_ATTENTION.dueSoon:
      return "Ações abertas com vencimento próximo conforme o dashboard.";
  }
}
