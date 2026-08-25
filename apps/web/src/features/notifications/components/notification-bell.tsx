"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
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

export function NotificationBell() {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const { canRead, canConfirmAwareness, isOffline } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);

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
      toast.success("Marcadas como lidas.");
      void refetch();
    });
  }

  function handleConfirmAwareness(notificationId: string) {
    void confirmMutation
      .mutateAsync(notificationId)
      .then(() => {
        void refetch();
      })
      .catch((error: unknown) => {
        if (isNotificationForbiddenError(error)) {
          return;
        }
      });
  }

  return (
    <div className="relative">
      <Button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="relative"
        size="icon"
        type="button"
        variant="outline"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {formatBadgeCount(unreadCount)}
          </span>
        ) : null}
        {pendingAwarenessCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-amber-400"
          />
        ) : null}
      </Button>

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
    </div>
  );
}
