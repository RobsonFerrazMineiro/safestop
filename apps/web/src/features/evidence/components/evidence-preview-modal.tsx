"use client";

import { useEffect, useRef } from "react";

import { Can } from "@/features/authorization";

import { useEvidenceSignedUrl } from "../hooks/use-evidence";
import type { EvidenceListItem } from "../types";

type EvidencePreviewModalProps = {
  occurrenceId: string;
  evidence: EvidenceListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (item: EvidenceListItem) => void;
};

function formatEvidenceDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function EvidencePreviewModal({
  occurrenceId,
  evidence,
  isOpen,
  onClose,
  onDelete,
}: EvidencePreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { signedUrl, isLoading, isError, refetch } = useEvidenceSignedUrl(
    occurrenceId,
    isOpen ? evidence?.id : null,
  );

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

  if (!evidence) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-4xl rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/70"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex flex-col gap-4 p-4">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-500">Evidência inicial</p>
            <h2 className="truncate text-lg font-semibold">{evidence.originalFileName}</h2>
            <p className="text-sm text-gray-400">
              Por {evidence.uploadedByName ?? "—"} · {formatEvidenceDate(evidence.createdAt)}
            </p>
            {evidence.caption ? (
              <p className="mt-1 text-sm text-gray-300">{evidence.caption}</p>
            ) : null}
          </div>
          <button
            aria-label="Fechar visualização"
            className="rounded-md border border-gray-700 px-3 py-1 text-sm text-gray-300 hover:bg-gray-800"
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-[240px] items-center justify-center rounded-md border border-gray-800 bg-black/40">
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando imagem...</p>
          ) : isError || !signedUrl ? (
            <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
              <p>Não foi possível carregar a imagem.</p>
              <button
                className="text-orange-400 underline"
                type="button"
                onClick={() => {
                  void refetch();
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <img
              alt={evidence.caption ?? evidence.originalFileName}
              className="max-h-[70vh] w-full object-contain"
              src={signedUrl}
            />
          )}
        </div>

        {onDelete ? (
          <Can permission="occurrence.create">
            <div className="flex justify-end">
              <button
                className="rounded-md border border-red-900/60 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40"
                type="button"
                onClick={() => onDelete(evidence)}
              >
                Remover
              </button>
            </div>
          </Can>
        ) : null}
      </div>
    </dialog>
  );
}
