"use client";

import { useState } from "react";
import type { OccurrenceTimelineItem } from "@safestop/types";

import type { EvidenceListItem } from "@/features/evidence";
import { EvidencePreviewModal } from "@/features/evidence";

import { getMetadataString, getTimelineItemTitle } from "../services/map-timeline-item";

type TimelineItemEvidenceProps = {
  item: OccurrenceTimelineItem;
  occurrenceId: string;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapToPreviewEvidence(
  item: OccurrenceTimelineItem,
  occurrenceId: string,
  attachmentId: string,
): EvidenceListItem {
  const fileName = getMetadataString(item.metadata, "originalFileName") ?? item.title;
  const mimeType = getMetadataString(item.metadata, "mimeType") ?? "image/jpeg";
  const fileSizeValue = item.metadata.fileSize;
  const fileSize = typeof fileSizeValue === "number" ? fileSizeValue : 0;

  return {
    id: attachmentId,
    occurrenceId,
    organizationId: "",
    attachmentType: "INITIAL_EVIDENCE",
    originalFileName: fileName,
    mimeType: mimeType as EvidenceListItem["mimeType"],
    fileSize,
    caption: item.body,
    uploadStatus: "COMPLETED",
    createdAt: item.occurredAt,
    uploadedByName: item.actorName,
  };
}

export function TimelineItemEvidence({ item, occurrenceId }: TimelineItemEvidenceProps) {
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceListItem | null>(null);
  const isRemoved = item.kind === "EVIDENCE_REMOVED";
  const title = getTimelineItemTitle(item);
  const attachmentId = getMetadataString(item.metadata, "attachmentId");
  const canPreview = item.kind === "EVIDENCE_ADDED" && attachmentId !== null;

  return (
    <>
      <li
        className={`flex gap-3 border-l-2 ${isRemoved ? "border-gray-700 opacity-60" : "border-gray-600"} pl-4`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {canPreview ? (
            <button
              aria-label={`Evidência ${title}, tocar para ampliar`}
              className="text-left"
              type="button"
              onClick={() =>
                setPreviewEvidence(mapToPreviewEvidence(item, occurrenceId, attachmentId))
              }
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-base">
                  📷
                </span>
                <span className="text-sm font-medium text-gray-100">{title}</span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-base">
                📷
              </span>
              <span
                className={`text-sm font-medium text-gray-400 ${isRemoved ? "line-through" : ""}`}
              >
                {title}
              </span>
            </div>
          )}

          {item.body && !isRemoved ? <p className="text-sm text-gray-300">{item.body}</p> : null}

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {item.actorName ? <span>{item.actorName}</span> : null}
            <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
          </div>
        </div>
      </li>

      <EvidencePreviewModal
        evidence={previewEvidence}
        isOpen={previewEvidence !== null}
        occurrenceId={occurrenceId}
        onClose={() => setPreviewEvidence(null)}
      />
    </>
  );
}
