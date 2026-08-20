"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { NotificationItem } from "./notification-item";
import {
  NotificationEmptyState,
  NotificationErrorState,
  NotificationLoadingSkeleton,
  NotificationOfflineNotice,
} from "./notification-states";
import type { NotificationListItem } from "../types";

type NotificationPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  items: NotificationListItem[];
  isLoading: boolean;
  isError: boolean;
  isOffline: boolean;
  canConfirmAwareness: boolean;
  isMarkingAll: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (notificationId: string) => void;
  onConfirmAwareness: (notificationId: string) => void;
  onRetry: () => void;
};

export function NotificationPopover({
  isOpen,
  onClose,
  items,
  isLoading,
  isError,
  isOffline,
  canConfirmAwareness,
  isMarkingAll,
  onMarkAllRead,
  onMarkRead,
  onConfirmAwareness,
  onRetry,
}: NotificationPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-[min(400px,calc(100vw-2rem))] rounded-lg border border-gray-700 bg-gray-900 shadow-xl"
      role="dialog"
      aria-label="Notificações recentes"
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-100">Notificações</h2>
        <button
          className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50"
          disabled={isMarkingAll || isOffline || items.length === 0}
          type="button"
          onClick={onMarkAllRead}
        >
          Marcar todas
        </button>
      </div>

      <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto p-3">
        {isOffline ? <NotificationOfflineNotice /> : null}

        {isLoading ? <NotificationLoadingSkeleton rows={3} /> : null}

        {!isLoading && isError ? <NotificationErrorState onRetry={onRetry} /> : null}

        {!isLoading && !isError && items.length === 0 ? <NotificationEmptyState /> : null}

        {!isLoading && !isError
          ? items.map((item) => (
              <NotificationItem
                key={item.id}
                canConfirmAwareness={canConfirmAwareness}
                compact
                isOffline={isOffline}
                item={item}
                onConfirmAwareness={onConfirmAwareness}
                onMarkRead={onMarkRead}
              />
            ))
          : null}
      </div>

      <div className="border-t border-gray-800 px-4 py-3 text-center">
        <Link
          className="text-sm font-medium text-orange-400 hover:text-orange-300"
          href="/notifications"
          onClick={onClose}
        >
          Ver todas →
        </Link>
      </div>
    </div>
  );
}
