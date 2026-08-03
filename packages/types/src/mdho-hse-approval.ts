/**
 * Aprovação HSE — fila e guards (Sprint 2.7).
 * Referência: docs/decisions/HSE-APPROVAL-DECISIONS.md
 */

import type { OccurrenceSeverity } from "./occurrence-status";

import type { MdhoAssessmentStatus } from "./mdho-assessment";

/** Item da fila `list_mdho_pending_approvals` (PO-HSE-12). */
export type MdhoPendingApprovalItem = {
  occurrenceId: string;
  organizationId: string;
  assessmentId: string;
  publicCode: string;
  title: string;
  submittedAt: string;
  submittedBy: string;
  submittedByName: string | null;
  areaName: string | null;
  taskSummary: string;
  criticality: OccurrenceSeverity;
};

/** Cursor serializado na RPC (snake_case PostgREST). */
export type MdhoPendingApprovalCursorPayload = {
  submitted_at: string;
  assessment_id: string;
};

export type MdhoPendingApprovalCursor = {
  submittedAt: string;
  assessmentId: string;
};

export type ListMdhoPendingApprovalsResult = {
  items: MdhoPendingApprovalItem[];
  nextCursor: MdhoPendingApprovalCursor | null;
};

/** Permissões derivadas de RBAC para guards HSE (PO-HSE-2, PO-HSE-12). */
export type HseApprovalPermissions = {
  mdhoApprove: boolean;
  mdhoReturn: boolean;
};

/** Contexto UI — fila inline e detalhe (HSE-APPROVAL-DECISIONS § Guards UI). */
export type HseApprovalContext = {
  currentUserId: string;
  isPlatformAdmin: boolean;
  permissions: HseApprovalPermissions;
};

export type CanApproveMdhoAssessmentInput = {
  assessment: {
    status: MdhoAssessmentStatus;
    submittedBy: string | null;
  };
  userId: string;
  permissions: Pick<HseApprovalPermissions, "mdhoApprove">;
  isPlatformAdmin?: boolean;
};

/** PO-HSE-7 — bloqueia autoaprovação no client antes da RPC. */
export function canApproveMdhoAssessment(input: CanApproveMdhoAssessmentInput): boolean {
  if (input.isPlatformAdmin === true) {
    return false;
  }

  if (!input.permissions.mdhoApprove) {
    return false;
  }

  if (input.assessment.status !== "SUBMITTED") {
    return false;
  }

  if (input.assessment.submittedBy === null) {
    return false;
  }

  return input.assessment.submittedBy !== input.userId;
}

export function canReturnMdhoAssessment(input: {
  assessment: { status: MdhoAssessmentStatus };
  permissions: Pick<HseApprovalPermissions, "mdhoReturn">;
  isPlatformAdmin?: boolean;
}): boolean {
  if (input.isPlatformAdmin === true) {
    return false;
  }

  if (!input.permissions.mdhoReturn) {
    return false;
  }

  return input.assessment.status === "SUBMITTED";
}

export function showHseApprovalQueue(context: HseApprovalContext): boolean {
  return context.permissions.mdhoApprove && !context.isPlatformAdmin;
}

type MdhoPendingApprovalItemRpc = MdhoPendingApprovalItem;

export function mapMdhoPendingApprovalItem(
  row: MdhoPendingApprovalItemRpc,
): MdhoPendingApprovalItem {
  return row;
}

export function mapMdhoPendingApprovalCursor(
  cursor: MdhoPendingApprovalCursorPayload | null,
): MdhoPendingApprovalCursor | null {
  if (!cursor) {
    return null;
  }

  return {
    submittedAt: cursor.submitted_at,
    assessmentId: cursor.assessment_id,
  };
}

export function mapListMdhoPendingApprovalsResult(data: {
  items: MdhoPendingApprovalItemRpc[];
  nextCursor?: MdhoPendingApprovalCursorPayload | null;
}): ListMdhoPendingApprovalsResult {
  return {
    items: data.items.map(mapMdhoPendingApprovalItem),
    nextCursor: mapMdhoPendingApprovalCursor(data.nextCursor ?? null),
  };
}
