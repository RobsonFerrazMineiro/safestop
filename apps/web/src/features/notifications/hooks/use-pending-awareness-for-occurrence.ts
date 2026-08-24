"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationQueryKeys } from "@safestop/query-keys";
import {
  NOTIFICATION_LIST_DEFAULT_LIMIT,
  NOTIFICATION_STALE_TIME_MS,
  requiresNotificationAwareness,
  type NotificationListItem,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { listMyNotifications } from "../services/list-my-notifications";

const MAX_PAGES = 5;

async function findPendingAwarenessForOccurrence(
  organizationId: string,
  occurrenceId: string,
): Promise<NotificationListItem | null> {
  let cursor: string | null = null;
  let pagesFetched = 0;

  while (pagesFetched < MAX_PAGES) {
    const page = await listMyNotifications({
      organizationId,
      cursor,
      limit: NOTIFICATION_LIST_DEFAULT_LIMIT,
    });

    const match = page.items.find(
      (item) => item.occurrenceId === occurrenceId && requiresNotificationAwareness(item),
    );

    if (match) {
      return match;
    }

    if (!page.nextCursor) {
      break;
    }

    cursor = page.nextCursor;
    pagesFetched += 1;
  }

  return null;
}

/**
 * Localiza a notificação com ciência pendente do usuário atual associada a
 * uma ocorrência, para exibir o banner no topo do Detalhe (Seção I,
 * UX-CONVERGENCE-UI-SPEC.md). Espelha
 * apps/mobile/.../use-pending-awareness-for-occurrence.ts.
 */
export function usePendingAwarenessForOccurrence(occurrenceId: string) {
  const { can, isReady: isAuthReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id ?? "";
  const canRead = can("notification.read");
  const canConfirm = can("notification.confirm_awareness");
  const enabled =
    isOrgReady &&
    isAuthReady &&
    organizationId.length > 0 &&
    canRead &&
    canConfirm &&
    occurrenceId.length > 0;

  const query = useQuery({
    queryKey: [
      ...notificationQueryKeys.all(organizationId),
      "pending-awareness",
      occurrenceId,
    ] as const,
    queryFn: () => findPendingAwarenessForOccurrence(organizationId, occurrenceId),
    enabled,
    staleTime: NOTIFICATION_STALE_TIME_MS,
  });

  return {
    notification: query.data ?? null,
    isLoading: enabled && query.isLoading,
    refetch: query.refetch,
  };
}
