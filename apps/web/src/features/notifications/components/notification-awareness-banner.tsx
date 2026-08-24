"use client";

import { useEffect, useRef, useState } from "react";

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
 * Banner de ciência pendente no topo do Detalhe da PP (Web) — equivalente ao
 * `NotificationAwarenessBanner` do Mobile. Reaproveita a mesma lógica de
 * `isConfirming` da correção F1 para bloquear duplo envio.
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isConfirmOpen && !dialog.open) dialog.showModal();
    if (!isConfirmOpen && dialog.open) dialog.close();
  }, [isConfirmOpen]);

  if (!notification) {
    return null;
  }

  function handleConfirm() {
    setError(null);

    confirmMutation
      .mutateAsync(notification!.id)
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

      <button
        className="w-full rounded-md bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 sm:w-auto sm:self-start"
        disabled={isOffline || confirmMutation.isPending}
        type="button"
        onClick={() => {
          if (notification.priority === "CRITICAL") {
            setIsConfirmOpen(true);
            return;
          }
          handleConfirm();
        }}
      >
        {confirmMutation.isPending ? "Confirmando…" : "Confirmar ciência"}
      </button>

      {error ? (
        <p className="text-xs text-red-300" role="alert">
          {error}
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
            handleConfirm();
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
              disabled={isOffline || confirmMutation.isPending}
              type="submit"
            >
              {confirmMutation.isPending ? "Confirmando…" : "Confirmar ciência"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
