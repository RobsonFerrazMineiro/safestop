export const NOTIFICATION_COPY = {
  title: "Notificações",
  subtitle: (unread: number, pendingAwareness: number) =>
    `${unread} não lidas · ${pendingAwareness} aguardando ciência`,
  filterAll: "Todas",
  filterUnread: "Não lidas",
  filterPendingAwareness: "Pendentes de ciência",
  filterCritical: "Críticas",
  filterInterdiction: "Interdições",
  filterVerAndAct: "Ver e Agir",
  empty: "Nenhuma notificação.",
  markAllRead: "Marcar todas como lidas",
  unreadChip: "Não lida",
  pendingAwarenessChip: "Ciência pendente",
  confirmedAwarenessChip: "Ciência confirmada",
  confirmAwarenessCta: "Confirmar ciência",
  confirmAwarenessDialog: "Confirma que está ciente desta ocorrência?",
  awarenessBanner: "Confirme ciência desta ocorrência",
  prioritySr: (label: string) => `Prioridade ${label}`,
  accessibilityLabel: (unread: number, pendingAwareness: number) =>
    `Notificações, ${unread} não lidas, ${pendingAwareness} pendentes de ciência`,
  awarenessConfirmed: "Ciência confirmada.",
  markedRead: "Marcada como lida.",
  loadError: "Não foi possível carregar as notificações.",
  forbiddenAwareness: "Você não tem permissão para confirmar ciência.",
  offline: "Sem conexão. Reconecte para atualizar ou confirmar ciência.",
  loadMore: "Carregar mais",
  retry: "Tentar novamente",
  cancel: "Cancelar",
} as const;

export const NOTIFICATION_PRIORITY_LABELS = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
} as const;
