import type { NotificationPriority } from "@safestop/types";

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export function formatNotificationPriority(priority: NotificationPriority): string {
  return PRIORITY_LABELS[priority];
}

export function formatRelativeNotificationTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();

  if (diffMs < 60_000) {
    return "agora";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `há ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "ontem";
  }

  return `há ${days} dias`;
}

export function formatNotificationAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

export function formatBadgeCount(count: number): string {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}
