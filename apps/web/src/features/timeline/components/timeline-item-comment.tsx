"use client";

import { useState } from "react";
import type { OccurrenceTimelineItem } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useAuth } from "@/hooks/use-auth";

import { useDeleteComment } from "../hooks/use-delete-comment";
import { useUpdateComment } from "../hooks/use-update-comment";
import { getMetadataBoolean, getTimelineItemTitle } from "../services/map-timeline-item";
import {
  canDeleteTimelineComment,
  canEditTimelineComment,
  getTimelineCommentId,
} from "../utils/timeline-guards";
import { CommentDeleteDialog } from "./comments/comment-delete-dialog";
import { CommentEditForm } from "./comments/comment-edit-form";

type TimelineItemCommentProps = {
  item: OccurrenceTimelineItem;
  occurrenceId: string;
  organizationId: string;
  occurrenceStatus: string;
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

export function TimelineItemComment({
  item,
  occurrenceId,
  organizationId,
  occurrenceStatus,
}: TimelineItemCommentProps) {
  const { user } = useAuth();
  const { can } = useAuthorization();
  const updateComment = useUpdateComment(occurrenceId, organizationId);
  const deleteComment = useDeleteComment(occurrenceId, organizationId);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isRemoved = item.kind === "COMMENT_REMOVED";
  const title = getTimelineItemTitle(item);
  const isEdited = getMetadataBoolean(item.metadata, "isEdited");
  const commentId = getTimelineCommentId(item);

  const canEdit = canEditTimelineComment(item, user?.id, occurrenceStatus);
  const canDelete = canDeleteTimelineComment(
    item,
    user?.id,
    occurrenceStatus,
    can("occurrence.cancel"),
  );

  if (isRemoved) {
    return (
      <li className="flex gap-3 border-l-2 border-gray-700 pl-4 opacity-60">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-gray-400">{title}</span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {item.actorName ? <span>{item.actorName}</span> : null}
            <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <li className="flex gap-3 border-l-2 border-gray-600 pl-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-base">
                💬
              </span>
              <span className="text-sm font-medium text-gray-100">{title}</span>
            </div>

            {canEdit || canDelete ? (
              <div className="flex shrink-0 gap-2">
                {canEdit ? (
                  <button
                    className="rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setActionError(null);
                    }}
                  >
                    Editar
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    className="rounded px-2 py-1 text-xs text-red-300 hover:bg-gray-800"
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {!isEditing && item.body ? (
            <p className="whitespace-pre-wrap text-sm text-gray-300">{item.body}</p>
          ) : null}

          {isEditing && item.body ? (
            <CommentEditForm
              errorMessage={actionError}
              initialContent={item.body}
              isSaving={updateComment.isPending}
              onCancel={() => setIsEditing(false)}
              onSave={(content) => {
                if (!commentId) {
                  return;
                }

                updateComment.mutate(
                  { commentId, content },
                  {
                    onSuccess: () => {
                      setIsEditing(false);
                      setActionError(null);
                    },
                    onError: (error: Error) => {
                      setActionError(
                        error instanceof Error
                          ? error.message
                          : "Não foi possível salvar o comentário.",
                      );
                    },
                  },
                );
              }}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
            {isEdited ? <span>(editado)</span> : null}
          </div>
        </div>
      </li>

      <CommentDeleteDialog
        isDeleting={deleteComment.isPending}
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          if (!commentId) {
            return;
          }

          deleteComment.mutate(
            { commentId },
            {
              onSuccess: () => setShowDeleteDialog(false),
              onError: (error: Error) => {
                setActionError(
                  error instanceof Error ? error.message : "Não foi possível remover o comentário.",
                );
                setShowDeleteDialog(false);
              },
            },
          );
        }}
      />
    </>
  );
}
