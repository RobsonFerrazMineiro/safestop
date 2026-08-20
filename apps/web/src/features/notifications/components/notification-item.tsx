"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  isNotificationUnread,
  requiresNotificationAwareness,
  type NotificationListItem,
} from "@safestop/types";

import {
  formatNotificationAbsoluteTime,
  formatNotificationPriority,
  formatRelativeNotificationTime,
} from "../utils/format-labels";

type NotificationItemProps = {
  item: NotificationListItem;
  compact?: boolean;
  canConfirmAwareness: boolean;
  isOffline: boolean;
  onMarkRead: (notificationId: string) => void;
  onConfirmAwareness: (notificationId: string) => void;
  onAwarenessForbidden?: () => void;
};

function priorityClass(priority: NotificationListItem["priority"]): string {
  switch (priority) {
    case "CRITICAL":
      return "text-red-400";
    case "HIGH":
      return "text-orange-400";
    case "MEDIUM":
      return "text-blue-400";
    default:
      return "text-gray-400";
  }
}

export function NotificationItem({
  item,
  compact = false,
  canConfirmAwareness,
  isOffline,
  onMarkRead,
  onConfirmAwareness,
  onAwarenessForbidden,
}: NotificationItemProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const unread = isNotificationUnread(item);
  const pendingAwareness = requiresNotificationAwareness(item);
  const awarenessConfirmed = item.requiresAwareness && item.awarenessConfirmedAt !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isConfirmOpen && !dialog.open) dialog.showModal();
    if (!isConfirmOpen && dialog.open) dialog.close();
  }, [isConfirmOpen]);

  function handleOpenOccurrence() {
    if (unread) {
      onMarkRead(item.id);
    }

    router.push(`/stop-work/${item.occurrenceId}`);
  }

  function handleConfirmAwareness() {
    setActionError(null);

    try {
      onConfirmAwareness(item.id);
      setIsConfirmOpen(false);
    } catch {
      onAwarenessForbidden?.();
      setIsConfirmOpen(false);
    }
  }

  return (
    <article
      className={`flex flex-col gap-2 rounded-lg border px-3 py-3 transition ${
        unread ? "border-gray-600 bg-gray-900/70" : "border-gray-800 bg-gray-950/40"
      } ${compact ? "text-sm" : ""}`}
    >
      <button
        className="flex w-full flex-col gap-2 text-left"
        type="button"
        onClick={handleOpenOccurrence}
      >
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className={`mt-0.5 text-xs font-bold uppercase ${priorityClass(item.priority)}`}
          >
            ●
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="sr-only">Prioridade {formatNotificationPriority(item.priority)}</span>
            <h3 className={`truncate ${unread ? "font-semibold text-gray-100" : "text-gray-200"}`}>
              {item.title}
            </h3>
            <p className="line-clamp-2 text-gray-400">{item.message}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <time dateTime={item.createdAt} title={formatNotificationAbsoluteTime(item.createdAt)}>
            {formatRelativeNotificationTime(item.createdAt)}
          </time>
          {unread ? (
            <span className="rounded-full border border-gray-600 px-2 py-0.5 text-gray-300">
              Não lida
            </span>
          ) : null}
          {pendingAwareness ? (
            <span className="rounded-full border border-amber-600/60 bg-amber-950/30 px-2 py-0.5 text-amber-200">
              Ciência pendente
            </span>
          ) : null}
          {awarenessConfirmed ? (
            <span className="rounded-full border border-green-700/50 px-2 py-0.5 text-green-300">
              Ciência confirmada
            </span>
          ) : null}
        </div>
      </button>

      {pendingAwareness && canConfirmAwareness ? (
        <button
          className="w-full rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 sm:w-auto sm:self-start"
          disabled={isOffline}
          type="button"
          onClick={() => {
            setActionError(null);
            if (item.priority === "CRITICAL") {
              setIsConfirmOpen(true);
              return;
            }
            handleConfirmAwareness();
          }}
        >
          Confirmar ciência
        </button>
      ) : null}

      {actionError ? (
        <p className="text-xs text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsConfirmOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            handleConfirmAwareness();
          }}
        >
          <h2 className="text-lg font-semibold">Confirma que está ciente desta ocorrência?</h2>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsConfirmOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
              disabled={isOffline}
              type="submit"
            >
              Confirmar ciência
            </button>
          </div>
        </form>
      </dialog>
    </article>
  );
}
