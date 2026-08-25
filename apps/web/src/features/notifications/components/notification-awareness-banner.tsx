"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import {
  isNotificationForbiddenError,
  useConfirmNotificationAwareness,
} from "../hooks/use-confirm-notification-awareness";
import { useNotificationContext } from "../hooks/use-notification-context";
import { usePendingAwarenessForOccurrence } from "../hooks/use-pending-awareness-for-occurrence";

type NotificationAwarenessBannerProps = {
  organizationId: string;
  occurrenceId: string;
};

/**
 * Banner de ciência pendente no topo do Detalhe da PP (Web).
 * Ciência é CTA explícito — nunca toast.
 */
export function NotificationAwarenessBanner({
  organizationId,
  occurrenceId,
}: NotificationAwarenessBannerProps) {
  const { notification, refetch } = usePendingAwarenessForOccurrence(occurrenceId);
  const { isOffline } = useNotificationContext();
  const confirmMutation = useConfirmNotificationAwareness(organizationId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!notification) {
    return null;
  }

  const pendingNotification = notification;

  function handleConfirm() {
    setError(null);

    confirmMutation
      .mutateAsync(pendingNotification.id)
      .then(() => {
        setIsConfirmOpen(false);
        void refetch();
      })
      .catch((mutationError: unknown) => {
        setIsConfirmOpen(false);
        if (isNotificationForbiddenError(mutationError)) {
          setError("Você não tem permissão para confirmar ciência.");
        }
      });
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-600/60 bg-amber-950/30 p-4"
      role="alert"
    >
      <p className="text-sm font-medium text-amber-100">
        Você tem uma notificação com ciência pendente sobre esta ocorrência.
      </p>

      <Button
        className="w-full sm:w-auto sm:self-start"
        disabled={isOffline || confirmMutation.isPending}
        type="button"
        onClick={() => {
          if (pendingNotification.priority === "CRITICAL") {
            setIsConfirmOpen(true);
            return;
          }
          handleConfirm();
        }}
      >
        {confirmMutation.isPending ? "Confirmando…" : "Confirmar ciência"}
      </Button>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
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
              disabled={isOffline || confirmMutation.isPending}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              {confirmMutation.isPending ? "Confirmando…" : "Confirmar ciência"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
