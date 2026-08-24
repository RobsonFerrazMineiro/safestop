"use client";

import { useCallback, useState } from "react";

import { useOnlineStatus } from "@/hooks/use-online-status";

import { useDeleteEvidence, useOccurrenceEvidence, useUploadEvidence } from "../hooks/use-evidence";
import type { EvidenceListItem } from "../types";
import { EvidenceDeleteDialog } from "./evidence-delete-dialog";
import { EvidenceGallery } from "./evidence-gallery";
import { EvidencePreviewModal } from "./evidence-preview-modal";

type EvidenceSectionProps = {
  occurrenceId: string;
};

export function EvidenceSection({ occurrenceId }: EvidenceSectionProps) {
  const { evidence, isLoading, isError, refetch } = useOccurrenceEvidence(occurrenceId);
  const { deleteEvidence, isDeleting } = useDeleteEvidence(occurrenceId);
  const { queue, enqueueFiles, retryUpload, removeQueueItem, isUploading, canCreate } =
    useUploadEvidence(occurrenceId);

  const [previewItem, setPreviewItem] = useState<EvidenceListItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<EvidenceListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { isOffline } = useOnlineStatus();

  const handleSelectFiles = useCallback(
    async (files: FileList | File[]) => {
      setActionError(null);

      try {
        await enqueueFiles(files);
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Não foi possível adicionar a evidência.",
        );
      }
    },
    [enqueueFiles],
  );

  const hasQueue = queue.length > 0;
  const hasEvidence = evidence.length > 0;
  const showEmpty = !isLoading && !isError && !hasEvidence && !hasQueue;

  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border bg-gray-900/40 p-4 transition ${
        isDragActive ? "border-orange-400 bg-orange-500/5" : "border-gray-800"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragActive(false);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);

        if (event.dataTransfer.files.length > 0) {
          void handleSelectFiles(event.dataTransfer.files);
        }
      }}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Evidências</h2>
        <span className="text-sm tabular-nums text-gray-500">{evidence.length}</span>
      </header>

      {isOffline ? (
        <div className="rounded-md border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
          Você está offline. As evidências já sincronizadas podem não atualizar. Novos envios
          ficarão aguardando conexão.
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando evidências...</p>
      ) : isError ? (
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <p>Não foi possível carregar as evidências.</p>
          <p className="text-xs text-gray-500">Verifique sua conexão e tente novamente.</p>
          <button
            className="w-fit rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
            type="button"
            onClick={() => {
              void refetch();
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {showEmpty ? (
            <div className="text-sm text-gray-500">
              <p>Nenhuma evidência anexada.</p>
              <p className="mt-1 text-xs">
                Adicione fotos da condição insegura para fortalecer o registro.
              </p>
            </div>
          ) : null}

          <EvidenceGallery
            canUpload={canCreate}
            evidence={evidence}
            isUploading={isUploading}
            occurrenceId={occurrenceId}
            queueItems={queue}
            onPreview={setPreviewItem}
            onRemoveQueueItem={removeQueueItem}
            onRetry={(localId) => {
              void retryUpload(localId);
            }}
            onSelectFiles={handleSelectFiles}
          />
        </>
      )}

      {actionError ? <p className="text-xs text-red-300">{actionError}</p> : null}

      <EvidencePreviewModal
        evidence={previewItem}
        isOpen={previewItem !== null}
        occurrenceId={occurrenceId}
        onClose={() => setPreviewItem(null)}
        onDelete={setDeleteItem}
      />

      <EvidenceDeleteDialog
        isDeleting={isDeleting}
        isOpen={deleteItem !== null}
        onCancel={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (!deleteItem) {
            return;
          }

          await deleteEvidence(deleteItem.id);
          setDeleteItem(null);
          setPreviewItem(null);
        }}
      />
    </section>
  );
}
