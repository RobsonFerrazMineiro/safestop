"use client";

import { useEffect, useRef } from "react";

type ActionPlanCompleteDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ActionPlanCompleteDialog({
  isOpen,
  isPending,
  onClose,
  onConfirm,
}: ActionPlanCompleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form
        className="flex flex-col gap-4 p-6"
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2 className="text-lg font-semibold">Concluir o Plano de Ação?</h2>
        <p className="text-sm text-gray-400">
          Todas as ações elegíveis foram encerradas. A ocorrência permanecerá em tratativa.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Concluindo…" : "Concluir plano"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
