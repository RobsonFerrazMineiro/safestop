"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  isNotificationUnread,
  requiresNotificationAwareness,
  type NotificationListItem,
} from "@safestop/types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  isConfirming: boolean;
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
      return "text-muted-foreground";
  }
}

export function NotificationItem({
  item,
  compact = false,
  canConfirmAwareness,
  isOffline,
  isConfirming,
  onMarkRead,
  onConfirmAwareness,
  onAwarenessForbidden,
}: NotificationItemProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const unread = isNotificationUnread(item);
  const pendingAwareness = requiresNotificationAwareness(item);
  const awarenessConfirmed = item.requiresAwareness && item.awarenessConfirmedAt !== null;

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
        unread ? "border-border bg-card" : "border-border/60 bg-card/40"
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
            <h3
              className={`truncate ${unread ? "font-semibold text-foreground" : "text-foreground/90"}`}
            >
              {item.title}
            </h3>
            <p className="line-clamp-2 text-muted-foreground">{item.message}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={item.createdAt} title={formatNotificationAbsoluteTime(item.createdAt)}>
            {formatRelativeNotificationTime(item.createdAt)}
          </time>
          {unread ? <Badge variant="outline">Não lida</Badge> : null}
          {pendingAwareness ? (
            <Badge className="border-amber-600/60 bg-amber-950/30 text-amber-200" variant="outline">
              Ciência pendente
            </Badge>
          ) : null}
          {awarenessConfirmed ? (
            <Badge className="border-green-700/50 bg-green-950/20 text-green-300" variant="outline">
              Ciência confirmada
            </Badge>
          ) : null}
        </div>
      </button>

      {pendingAwareness && canConfirmAwareness ? (
        <Button
          className="w-full sm:w-auto sm:self-start"
          disabled={isOffline || isConfirming}
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
          {isConfirming ? "Confirmando…" : "Confirmar ciência"}
        </Button>
      ) : null}

      {actionError ? (
        <p className="text-xs text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <AlertDialog
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
        }}
        open={isConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirma que está ciente desta ocorrência?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isOffline || isConfirming}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                handleConfirmAwareness();
              }}
            >
              {isConfirming ? "Confirmando…" : "Confirmar ciência"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
