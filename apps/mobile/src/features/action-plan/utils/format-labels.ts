import type { ActionItemPriority, ActionItemStatus, ActionPlanStatus } from "@safestop/types";

const PLAN_STATUS_LABELS: Record<ActionPlanStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  AWAITING_VALIDATION: "Aguardando validação",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const ITEM_STATUS_LABELS: Record<ActionItemStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  AWAITING_VALIDATION: "Aguardando validação",
  COMPLETED: "Concluída",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
};

const PRIORITY_LABELS: Record<ActionItemPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export function formatActionPlanStatus(status: ActionPlanStatus): string {
  return PLAN_STATUS_LABELS[status];
}

export function formatActionItemStatus(status: ActionItemStatus): string {
  return ITEM_STATUS_LABELS[status];
}

export function formatActionItemPriority(priority: ActionItemPriority): string {
  return PRIORITY_LABELS[priority];
}

export function isActionItemOverdue(dueAt: string, status: ActionItemStatus): boolean {
  if (status === "COMPLETED" || status === "CANCELLED") {
    return false;
  }

  return new Date(dueAt).getTime() < Date.now();
}

export function formatDueDate(dueAt: string): string {
  return new Date(dueAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function dueInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
