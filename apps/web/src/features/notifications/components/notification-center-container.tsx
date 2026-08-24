"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useRequirePermission } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import {
  isNotificationForbiddenError,
  useConfirmNotificationAwareness,
} from "../hooks/use-confirm-notification-awareness";
import { useMarkAllNotificationsRead } from "../hooks/use-mark-all-notifications-read";
import { useMarkNotificationRead } from "../hooks/use-mark-notification-read";
import { useNotificationBadgeCounts } from "../hooks/use-notification-badge-counts";
import { useNotificationContext } from "../hooks/use-notification-context";
import { useNotificationsInfiniteList } from "../hooks/use-notifications-infinite-list";
import { matchesNotificationFilter } from "../utils/notification-filters";
import { NotificationFilters } from "./notification-filters";
import { NotificationItem } from "./notification-item";
import {
  NotificationEmptyState,
  NotificationErrorState,
  NotificationForbiddenState,
  NotificationLoadingSkeleton,
  NotificationOfflineNotice,
} from "./notification-states";
import type { NotificationFilter } from "../types";

const MAX_AUTO_FETCH_PAGES = 5;

function parseNotificationFilter(value: string | null): NotificationFilter | null {
  const allowed: NotificationFilter[] = [
    "all",
    "unread",
    "pending-awareness",
    "critical",
    "interdiction",
    "ver-and-act",
  ];

  if (!value) {
    return null;
  }

  return allowed.includes(value as NotificationFilter) ? (value as NotificationFilter) : null;
}

export function NotificationCenterContainer() {
  useRequirePermission("notification.read");

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = parseNotificationFilter(searchParams.get("filter"));

  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const { canRead, canConfirmAwareness, isOffline } = useNotificationContext();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>(urlFilter ?? "all");
  const resolvedFilter = urlFilter ?? activeFilter;
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { unreadCount, pendingAwarenessCount } = useNotificationBadgeCounts();
  const {
    items,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    enabled,
  } = useNotificationsInfiniteList(organizationId, canRead);

  const markReadMutation = useMarkNotificationRead(organizationId);
  const markAllMutation = useMarkAllNotificationsRead(organizationId);
  const confirmMutation = useConfirmNotificationAwareness(organizationId);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesNotificationFilter(item, resolvedFilter)),
    [resolvedFilter, items],
  );

  useEffect(() => {
    if (resolvedFilter === "all" || isLoading || isFetchingNextPage) {
      return;
    }

    if (filteredItems.length > 0 || !hasNextPage) {
      return;
    }

    const loadedPages = Math.ceil(items.length / 20);

    if (loadedPages >= MAX_AUTO_FETCH_PAGES) {
      return;
    }

    void fetchNextPage();
  }, [
    resolvedFilter,
    fetchNextPage,
    filteredItems.length,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    items.length,
  ]);

  function handleFilterChange(filter: NotificationFilter) {
    setActiveFilter(filter);

    const params = new URLSearchParams(searchParams.toString());

    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }

    const query = params.toString();
    router.replace(query.length > 0 ? `/notifications?${query}` : "/notifications");
  }

  if (!canRead || !enabled) {
    return <NotificationForbiddenState />;
  }

  function handleMarkRead(notificationId: string) {
    void markReadMutation.mutate(notificationId);
  }

  function handleMarkAllRead() {
    void markAllMutation.mutateAsync().then(() => {
      setStatusMessage("Marcadas como lidas.");
    });
  }

  function handleConfirmAwareness(notificationId: string) {
    void confirmMutation
      .mutateAsync(notificationId)
      .then(() => {
        setStatusMessage("Ciência confirmada.");
      })
      .catch((mutationError: unknown) => {
        if (isNotificationForbiddenError(mutationError)) {
          setStatusMessage("Você não tem permissão para confirmar ciência.");
        }
      });
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-100">Notificações</h1>
        <p className="text-sm text-gray-400">
          {unreadCount} não lidas · {pendingAwarenessCount} aguardando ciência
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
          disabled={markAllMutation.isPending || isOffline || items.length === 0}
          type="button"
          onClick={handleMarkAllRead}
        >
          {markAllMutation.isPending ? "Marcando…" : "Marcar todas como lidas"}
        </button>
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/stop-work">
          Paralisações
        </Link>
      </div>

      {isOffline ? <NotificationOfflineNotice /> : null}

      {statusMessage ? (
        <p className="text-sm text-green-300" role="status">
          {statusMessage}
        </p>
      ) : null}

      <NotificationFilters activeFilter={resolvedFilter} onChange={handleFilterChange} />

      {isLoading ? <NotificationLoadingSkeleton /> : null}

      {!isLoading && isError ? (
        <NotificationErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError && filteredItems.length === 0 ? <NotificationEmptyState /> : null}

      {!isLoading && !isError && filteredItems.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <NotificationItem
              key={item.id}
              canConfirmAwareness={canConfirmAwareness}
              isConfirming={confirmMutation.isPending}
              isOffline={isOffline}
              item={item}
              onConfirmAwareness={handleConfirmAwareness}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && hasNextPage ? (
        <button
          className="self-center rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
          disabled={isFetchingNextPage}
          type="button"
          onClick={() => {
            void fetchNextPage();
          }}
        >
          {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </button>
      ) : null}
    </section>
  );
}
