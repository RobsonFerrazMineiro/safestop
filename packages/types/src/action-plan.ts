/**
 * Plano de Ação estruturado (Sprint 3.0).
 * Referência: docs/decisions/ACTION-PLAN-DECISIONS.md
 * Ramo IO + EM_TRATATIVA + IMS registrado — sem integração IMS externa.
 */

import type { OccurrenceDecisionType, OccurrenceStatus } from "./occurrence-status";

export const ACTION_PLAN_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_VALIDATION",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ActionPlanStatus = (typeof ACTION_PLAN_STATUSES)[number];

/** Plano editável / aceita novas ações (PO-AP-3). */
export const ACTION_PLAN_ACTIVE_STATUSES = ["OPEN", "IN_PROGRESS", "AWAITING_VALIDATION"] as const;

export type ActionPlanActiveStatus = (typeof ACTION_PLAN_ACTIVE_STATUSES)[number];

export const ACTION_ITEM_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "AWAITING_VALIDATION",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

export type ActionItemStatus = (typeof ACTION_ITEM_STATUSES)[number];

export const ACTION_ITEM_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type ActionItemPriority = (typeof ACTION_ITEM_PRIORITIES)[number];

export const ACTION_ITEM_ATTACHMENT_UPLOAD_STATUSES = ["PENDING", "COMPLETED", "FAILED"] as const;

export type ActionItemAttachmentUploadStatus =
  (typeof ACTION_ITEM_ATTACHMENT_UPLOAD_STATUSES)[number];

export const ACTION_PLAN_VALIDATION_OUTCOMES = ["COMPLETED", "REJECTED"] as const;

export type ActionPlanValidationOutcome = (typeof ACTION_PLAN_VALIDATION_OUTCOMES)[number];

/** Sub-ações em metadata `ACTION_ITEM_STATUS_CHANGED`. */
export const ACTION_ITEM_STATUS_SUB_ACTIONS = [
  "start",
  "submit",
  "validate_completed",
  "validate_rejected",
  "cancel",
] as const;

export type ActionItemStatusSubAction = (typeof ACTION_ITEM_STATUS_SUB_ACTIONS)[number];

export const ACTION_PLAN_SUMMARY_MAX_LENGTH = 4000;

export const ACTION_ITEM_TITLE_MAX_LENGTH = 200;

export const ACTION_ITEM_DESCRIPTION_MAX_LENGTH = 4000;

export const ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH = 4000;

export const ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH = 4000;

export const ACTION_ITEM_CANCEL_REASON_MIN_LENGTH = 10;

export const ACTION_ITEM_CANCEL_REASON_MAX_LENGTH = 4000;

export const ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH = 10;

export const ACTION_ITEM_ATTACHMENT_CAPTION_MAX_LENGTH = 500;

export const ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES = 10_485_760;

export const ACTION_ITEM_ATTACHMENT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ActionItemAttachmentMimeType = (typeof ACTION_ITEM_ATTACHMENT_MIME_TYPES)[number];

/** Cache operacional — paridade HSE/list (PO-AP, ACTION-PLAN-DECISIONS § Cache). */
export const ACTION_PLAN_STALE_TIME_MS = 30_000;

export type ActionPlan = {
  id: string;
  occurrenceId: string;
  organizationId: string;
  status: ActionPlanStatus;
  summary: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  closedAt: string | null;
};

export type ActionItem = {
  id: string;
  actionPlanId: string;
  organizationId: string;
  title: string;
  description: string | null;
  responsibleMemberId: string;
  responsibleOrganizationId: string;
  dueAt: string;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  completionDescription: string | null;
  completedAt: string | null;
  completedBy: string | null;
  validatedAt: string | null;
  validatedBy: string | null;
  validationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActionItemAttachment = {
  id: string;
  actionItemId: string;
  organizationId: string;
  storageBucket: string;
  storagePath: string;
  uploadStatus: ActionItemAttachmentUploadStatus;
  mimeType: ActionItemAttachmentMimeType;
  fileSize: number;
  caption: string | null;
  createdAt: string;
  createdBy: string;
};

export type CreateActionPlanInput = {
  occurrenceId: string;
  summary?: string;
};

export type UpdateActionPlanInput = {
  planId: string;
  summary?: string;
};

export type SubmitActionItemInput = {
  itemId: string;
  completionDescription?: string;
};

export type ValidateActionItemInput = {
  itemId: string;
  outcome: ActionPlanValidationOutcome;
  note?: string;
};

export type CancelActionItemInput = {
  itemId: string;
  reason: string;
};

export type ActionPlanSnapshot = {
  id: string;
  status: ActionPlanStatus;
  occurrenceId: string;
  summary?: string | null;
};

export type ActionItemSnapshot = {
  id: string;
  status: ActionItemStatus;
  actionPlanId: string;
};

export type CreateActionPlanResult = {
  plan: ActionPlanSnapshot;
  /** PO-AP — retry quando plano ativo já existe. */
  idempotent?: boolean;
};

export type UpdateActionPlanResult = {
  planId: string;
};

export type SubmitActionItemResult = {
  item: ActionItemSnapshot;
};

export type ValidateActionItemResult = {
  item: ActionItemSnapshot;
};

export type CancelActionItemResult = {
  item: ActionItemSnapshot;
};

export type CompleteActionPlanResult = {
  plan: ActionPlanSnapshot;
};

/** Erros tratáveis na UI (ACTION-PLAN-DECISIONS § Erros). */
export const ACTION_PLAN_ERROR_CODES = [
  "STATUS_MISMATCH",
  "ALREADY_EXISTS",
  "CONFLICT",
  "VALIDATION_ERROR",
] as const;

export type ActionPlanErrorCode = (typeof ACTION_PLAN_ERROR_CODES)[number];

/** Segregação PO-AP-17 — espelha MDHO `SELF_APPROVAL_FORBIDDEN`. */
export const ACTION_PLAN_APPROVAL_ERROR_CODES = ["SELF_VALIDATION_FORBIDDEN"] as const;

export type ActionPlanApprovalErrorCode = (typeof ACTION_PLAN_APPROVAL_ERROR_CODES)[number];

export const ACTION_PLAN_DOMAIN_ERROR_CODES = [
  ...ACTION_PLAN_ERROR_CODES,
  ...ACTION_PLAN_APPROVAL_ERROR_CODES,
] as const;

export type ActionPlanDomainErrorCode = (typeof ACTION_PLAN_DOMAIN_ERROR_CODES)[number];

export type ActionPlanError = {
  code: ActionPlanErrorCode;
  message: string;
  currentStatus?: ActionPlanStatus | ActionItemStatus;
};

export type ActionPlanApprovalError = {
  code: ActionPlanApprovalErrorCode;
  message: string;
};

export type ActionPlanDomainError = ActionPlanError | ActionPlanApprovalError;

export function isActionPlanStatus(value: string): value is ActionPlanStatus {
  return (ACTION_PLAN_STATUSES as readonly string[]).includes(value);
}

export function isActionItemStatus(value: string): value is ActionItemStatus {
  return (ACTION_ITEM_STATUSES as readonly string[]).includes(value);
}

export function isActionItemPriority(value: string): value is ActionItemPriority {
  return (ACTION_ITEM_PRIORITIES as readonly string[]).includes(value);
}

export function isActionPlanValidationOutcome(value: string): value is ActionPlanValidationOutcome {
  return (ACTION_PLAN_VALIDATION_OUTCOMES as readonly string[]).includes(value);
}

export function isActionPlanErrorCode(value: string): value is ActionPlanErrorCode {
  return (ACTION_PLAN_ERROR_CODES as readonly string[]).includes(value);
}

export function isActionPlanApprovalErrorCode(value: string): value is ActionPlanApprovalErrorCode {
  return (ACTION_PLAN_APPROVAL_ERROR_CODES as readonly string[]).includes(value);
}

export function isActionPlanDomainErrorCode(value: string): value is ActionPlanDomainErrorCode {
  return (ACTION_PLAN_DOMAIN_ERROR_CODES as readonly string[]).includes(value);
}

export function isActionPlanActiveStatus(status: ActionPlanStatus): boolean {
  return (ACTION_PLAN_ACTIVE_STATUSES as readonly string[]).includes(status);
}

export type ActionPlanSectionOccurrence = {
  decisionType: OccurrenceDecisionType | null;
  status: OccurrenceStatus;
  imsReferenceCode: string | null;
};

export type ActionPlanPermissions = {
  actionPlanCreate: boolean;
  actionPlanManage: boolean;
  actionPlanValidate: boolean;
};

export type ActionPlanGuardContext = {
  isPlatformAdmin: boolean;
  permissions: ActionPlanPermissions;
  hasActivePlan?: boolean;
  isResponsibleMember?: boolean;
};

/**
 * Seção Plano de Ação visível no detalhe IO (PO-AP-1, PO-AP-18).
 */
export function shouldShowActionPlanSection(occurrence: ActionPlanSectionOccurrence): boolean {
  if (occurrence.decisionType !== "INTERDICAO_OFICIAL") {
    return false;
  }

  if (occurrence.status !== "EM_TRATATIVA") {
    return false;
  }

  if (occurrence.imsReferenceCode === null || occurrence.imsReferenceCode.trim() === "") {
    return false;
  }

  return true;
}

export function canCreateActionPlan(input: {
  occurrence: ActionPlanSectionOccurrence;
  context: ActionPlanGuardContext;
}): boolean {
  if (!shouldShowActionPlanSection(input.occurrence)) {
    return false;
  }

  if (input.context.isPlatformAdmin) {
    return false;
  }

  if (!input.context.permissions.actionPlanCreate) {
    return false;
  }

  if (input.context.hasActivePlan === true) {
    return false;
  }

  return true;
}

export function canManageActionPlan(context: ActionPlanGuardContext): boolean {
  if (context.isPlatformAdmin) {
    return false;
  }

  return context.permissions.actionPlanManage;
}

export function canValidateActionItem(input: {
  item: { status: ActionItemStatus; completedBy: string | null };
  currentUserId: string;
  context: ActionPlanGuardContext;
}): boolean {
  if (input.context.isPlatformAdmin) {
    return false;
  }

  if (!input.context.permissions.actionPlanValidate) {
    return false;
  }

  if (input.item.status !== "AWAITING_VALIDATION") {
    return false;
  }

  if (input.item.completedBy !== null && input.item.completedBy === input.currentUserId) {
    return false;
  }

  return true;
}

export function canActAsActionItemResponsible(context: ActionPlanGuardContext): boolean {
  if (context.isPlatformAdmin) {
    return false;
  }

  return context.isResponsibleMember === true;
}

export function isActionPlanEditable(status: ActionPlanStatus): boolean {
  return isActionPlanActiveStatus(status);
}

export function isActionItemEditable(status: ActionItemStatus): boolean {
  return status === "PENDING" || status === "IN_PROGRESS" || status === "REJECTED";
}

export function canSubmitActionItem(input: {
  item: { status: ActionItemStatus };
  context: ActionPlanGuardContext;
}): boolean {
  if (input.context.isPlatformAdmin) {
    return false;
  }

  if (!input.item.status || !["PENDING", "IN_PROGRESS"].includes(input.item.status)) {
    return false;
  }

  return input.context.permissions.actionPlanManage || input.context.isResponsibleMember === true;
}

export function canCompleteActionPlan(input: {
  plan: { status: ActionPlanStatus };
  context: ActionPlanGuardContext;
}): boolean {
  if (!canManageActionPlan(input.context)) {
    return false;
  }

  return isActionPlanActiveStatus(input.plan.status);
}
