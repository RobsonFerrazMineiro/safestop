"use client";

import { useEffect, useRef } from "react";

type CommentDeleteDialogProps = {
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CommentDeleteDialog({
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: CommentDeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
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
        <h2 className="text-lg font-semibold">Remover comentário?</h2>
        <p className="text-sm text-gray-400">
          O texto deixará de ser exibido. A timeline mostrará &quot;Comentário removido&quot; para
          manter a rastreabilidade.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            disabled={isDeleting}
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            disabled={isDeleting}
            type="submit"
          >
            {isDeleting ? "Removendo..." : "Remover"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
