"use client";

import { Can } from "@/features/authorization";

import { useEvidenceSignedUrl } from "../hooks/use-evidence";
import {
  EVIDENCE_TILE_SIZE_CLASS,
  type EvidenceListItem,
  type EvidenceUploadQueueItem,
} from "../types";
import { EvidenceUploader } from "./evidence-uploader";

type EvidenceGalleryProps = {
  occurrenceId: string;
  evidence: EvidenceListItem[];
  queueItems: EvidenceUploadQueueItem[];
  canUpload: boolean;
  isUploading: boolean;
  onSelectFiles: (files: FileList | File[]) => void | Promise<void>;
  onPreview: (item: EvidenceListItem) => void;
  onRetry: (localId: string) => void;
  onRemoveQueueItem: (localId: string) => void;
};

function phaseLabel(item: EvidenceUploadQueueItem): string {
  switch (item.phase) {
    case "preparing":
      return "Preparando";
    case "uploading":
      return `Enviando ${item.progress}%`;
    case "registering":
      return "Registrando…";
    case "failed":
      return "Falha no envio";
    default:
      return "Enviando";
  }
}

function EvidenceSyncedTile({
  occurrenceId,
  index,
  item,
  onPreview,
}: {
  occurrenceId: string;
  index: number;
  item: EvidenceListItem;
  onPreview: (item: EvidenceListItem) => void;
}) {
  const { signedUrl, isLoading, isError, refetch } = useEvidenceSignedUrl(occurrenceId, item.id);

  return (
    <article
      className={`${EVIDENCE_TILE_SIZE_CLASS} group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-950`}
    >
      <button
        aria-label={`Evidência ${index + 1}, sincronizada`}
        className="block h-full w-full overflow-hidden"
        type="button"
        onClick={() => onPreview(item)}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-gray-900 text-[10px] text-gray-500">
            …
          </div>
        ) : isError || !signedUrl ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 bg-gray-900 px-1 text-center">
            <span className="text-[10px] leading-tight text-gray-400">
              Não foi possível carregar a imagem
            </span>
            <button
              className="text-[10px] text-orange-400 underline"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void refetch();
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <img
            alt={item.caption ?? item.originalFileName}
            className="h-full w-full object-cover"
            src={signedUrl}
          />
        )}
      </button>
    </article>
  );
}

function EvidenceQueueTile({
  index,
  item,
  onRemove,
  onRetry,
}: {
  index: number;
  item: EvidenceUploadQueueItem;
  onRemove: (localId: string) => void;
  onRetry: (localId: string) => void;
}) {
  const isFailed = item.phase === "failed";
  const isBusy =
    item.phase === "preparing" || item.phase === "uploading" || item.phase === "registering";

  return (
    <article
      aria-label={`Evidência ${index + 1}, ${isFailed ? "falha no envio" : "enviando"}`}
      className={`${EVIDENCE_TILE_SIZE_CLASS} relative overflow-hidden rounded-xl border border-gray-800 bg-gray-950`}
    >
      <img
        alt={item.fileName}
        className={`h-full w-full object-cover ${isBusy ? "opacity-60" : ""}`}
        src={item.previewUrl}
      />

      {isBusy ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-1 text-center">
          <span className="text-[10px] font-medium text-white">{phaseLabel(item)}</span>
          {item.phase === "uploading" ? (
            <div className="mt-1 h-1 w-12 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full bg-orange-400 transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {isFailed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 px-1 text-center">
          <span className="text-[10px] font-medium text-red-300">Falha no envio</span>
          <button
            className="text-[10px] text-orange-300 underline"
            type="button"
            onClick={() => onRetry(item.localId)}
          >
            Tentar novamente
          </button>
          <button
            aria-label={`Remover ${item.fileName} da fila`}
            className="text-[10px] text-gray-300 underline"
            type="button"
            onClick={() => onRemove(item.localId)}
          >
            Remover
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function EvidenceGallery({
  occurrenceId,
  evidence,
  queueItems,
  canUpload,
  isUploading,
  onSelectFiles,
  onPreview,
  onRetry,
  onRemoveQueueItem,
}: EvidenceGalleryProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {evidence.map((item, index) => (
        <EvidenceSyncedTile
          key={item.id}
          index={index}
          item={item}
          occurrenceId={occurrenceId}
          onPreview={onPreview}
        />
      ))}

      {queueItems.map((item, index) => (
        <EvidenceQueueTile
          key={item.localId}
          index={evidence.length + index}
          item={item}
          onRemove={onRemoveQueueItem}
          onRetry={onRetry}
        />
      ))}

      <Can permission="occurrence.create">
        {canUpload ? (
          <EvidenceUploader disabled={isUploading} onSelectFiles={onSelectFiles} />
        ) : null}
      </Can>
    </div>
  );
}
