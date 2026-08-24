"use client";

import { useState } from "react";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import {
  isNotificationForbiddenError,
  useConfirmNotificationAwareness,
} from "../hooks/use-confirm-notification-awareness";
import { useMarkAllNotificationsRead } from "../hooks/use-mark-all-notifications-read";
import { useMarkNotificationRead } from "../hooks/use-mark-notification-read";
import { useNotificationBadgeCounts } from "../hooks/use-notification-badge-counts";
import { useNotificationContext } from "../hooks/use-notification-context";
import { useNotificationPopoverList } from "../hooks/use-notification-popover-list";
import { formatBadgeCount } from "../utils/format-labels";
import { NotificationPopover } from "./notification-popover";

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path
        d="M15 17H9m8-4a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NotificationBell() {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const { canRead, canConfirmAwareness, isOffline } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { unreadCount, pendingAwarenessCount } = useNotificationBadgeCounts();
  const { items, isLoading, isError, refetch, enabled } = useNotificationPopoverList(
    organizationId,
    isOpen,
  );

  const markReadMutation = useMarkNotificationRead(organizationId);
  const markAllMutation = useMarkAllNotificationsRead(organizationId);
  const confirmMutation = useConfirmNotificationAwareness(organizationId);

  if (!canRead || !enabled) {
    return null;
  }

  const ariaLabel = `Notificações, ${unreadCount} não lidas, ${pendingAwarenessCount} pendentes de ciência`;

  function handleMarkRead(notificationId: string) {
    void markReadMutation.mutate(notificationId);
  }

  function handleMarkAllRead() {
    void markAllMutation.mutateAsync().then(() => {
      setToast("Marcadas como lidas.");
      void refetch();
    });
  }

  function handleConfirmAwareness(notificationId: string) {
    void confirmMutation
      .mutateAsync(notificationId)
      .then(() => {
        setToast("Ciência confirmada.");
        void refetch();
      })
      .catch((error: unknown) => {
        if (isNotificationForbiddenError(error)) {
          setToast("Você não tem permissão para confirmar ciência.");
        }
      });
  }

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="relative rounded-md border border-gray-700 p-2 text-gray-200 hover:bg-gray-800"
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {formatBadgeCount(unreadCount)}
          </span>
        ) : null}
        {pendingAwarenessCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-950 bg-amber-400"
          />
        ) : null}
      </button>

      <NotificationPopover
        canConfirmAwareness={canConfirmAwareness}
        isConfirming={confirmMutation.isPending}
        isError={isError}
        isLoading={isLoading}
        isMarkingAll={markAllMutation.isPending}
        isOffline={isOffline}
        isOpen={isOpen}
        items={items}
        onClose={() => {
          setIsOpen(false);
        }}
        onConfirmAwareness={handleConfirmAwareness}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
        onRetry={() => {
          void refetch();
        }}
      />

      {toast ? (
        <p className="sr-only" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
