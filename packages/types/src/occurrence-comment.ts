/**
 * Tipos de domínio para comentários de ocorrência (Sprint 2.3).
 * Referência: docs/database.md §12.1; TIMELINE-DECISIONS PO-2, PO-13
 */

export const OCCURRENCE_COMMENT_TYPES = [
  "GENERAL",
  "CORRECTION_UPDATE",
  "LEADERSHIP_NOTE",
  "HSE_NOTE",
  "RELEASE_NOTE",
  "SYSTEM_NOTE",
] as const;

export type OccurrenceCommentType = (typeof OCCURRENCE_COMMENT_TYPES)[number];

/** Tipos criáveis pelo usuário na Sprint 2.3 (PO-13). */
export const USER_CREATABLE_COMMENT_TYPES = ["GENERAL"] as const;

export type UserCreatableCommentType = (typeof USER_CREATABLE_COMMENT_TYPES)[number];

export const OCCURRENCE_COMMENT_MAX_LENGTH = 2000;

export const OCCURRENCE_COMMENT_EDIT_WINDOW_HOURS = 24;

export type OccurrenceComment = {
  id: string;
  organizationId: string;
  occurrenceId: string;
  authorId: string;
  commentType: OccurrenceCommentType;
  content: string | null;
  isInternal: boolean;
  createdAt: string;
  editedAt: string | null;
  editedBy: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
};

export type CreateOccurrenceCommentResult = {
  comment: OccurrenceComment;
};

export type UpdateOccurrenceCommentResult = {
  comment: OccurrenceComment;
};

export type DeleteOccurrenceCommentResult = {
  comment: OccurrenceComment;
};

export function isOccurrenceCommentType(value: string): value is OccurrenceCommentType {
  return (OCCURRENCE_COMMENT_TYPES as readonly string[]).includes(value);
}

export function isUserCreatableCommentType(value: string): value is UserCreatableCommentType {
  return (USER_CREATABLE_COMMENT_TYPES as readonly string[]).includes(value);
}
