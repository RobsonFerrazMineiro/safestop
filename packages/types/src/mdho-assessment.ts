/**
 * Avaliação Técnica MDHO (Sprint 2.6).
 * Referência: docs/decisions/MDHO-DECISIONS.md; docs/database.md §14.4–14.5
 */

import type { OccurrenceDecisionType, OccurrenceStatus } from "./occurrence-status";

export type {
  MdhoSelectionInput,
  SaveMdhoDraftInput,
  ReturnMdhoInput,
  SubmitMdhoInput,
} from "./mdho-assessment-inputs";

/** Status do assessment (PO-MDHO-17). */
export const MDHO_ASSESSMENT_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "RETURNED"] as const;

export type MdhoAssessmentStatus = (typeof MDHO_ASSESSMENT_STATUSES)[number];

export const MDHO_COMPLEMENT_MAX_LENGTH = 4000;

export const MDHO_RETURN_REASON_MIN_LENGTH = 10;

export const MDHO_RETURN_REASON_MAX_LENGTH = 4000;

export const MDHO_OTHER_DETAIL_MIN_LENGTH = 10;

export type MdhoSelection = {
  id: string;
  categoryId: string;
  optionId: string;
  detail: string | null;
  createdAt: string;
  createdBy: string;
};

export type MdhoAssessment = {
  id: string;
  occurrenceId: string;
  organizationId: string;
  status: MdhoAssessmentStatus;
  complement: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  returnedAt: string | null;
  returnedBy: string | null;
  returnReason: string | null;
  createdAt: string;
  updatedAt: string;
  selections?: MdhoSelection[];
};

export type MdhoAssessmentSnapshot = {
  id: string;
  occurrenceId: string;
  status: MdhoAssessmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type MdhoOccurrenceSnapshot = {
  id: string;
  status: OccurrenceStatus;
};

export type StartMdhoAssessmentResult = {
  assessment: MdhoAssessmentSnapshot;
  occurrence: MdhoOccurrenceSnapshot;
};

export type SaveMdhoDraftResult = {
  assessmentId: string;
  status: MdhoAssessmentStatus;
  updatedAt: string;
};

export type SubmitMdhoAssessmentResult = {
  assessment: {
    id: string;
    status: "SUBMITTED";
    submittedAt: string;
    submittedBy: string;
  };
  occurrence: MdhoOccurrenceSnapshot;
};

export type ApproveMdhoAssessmentResult = {
  assessment: {
    id: string;
    status: "APPROVED";
    approvedAt: string;
    approvedBy: string;
  };
  occurrence: MdhoOccurrenceSnapshot;
  /** PO-HSE-15 — retry idempotente após sucesso. */
  idempotent?: boolean;
};

export type ReturnMdhoAssessmentResult = {
  assessment: {
    id: string;
    status: "RETURNED";
    returnedAt: string;
    returnedBy: string;
    returnReason: string;
  };
  occurrence: MdhoOccurrenceSnapshot;
};

/** Erros tratáveis na UI (MDHO-DECISIONS § RPCs + HSE-APPROVAL 2.7). */
export const MDHO_CONFLICT_ERROR_CODES = [
  "STATUS_MISMATCH",
  "ALREADY_EXISTS",
  "ALREADY_SUBMITTED",
  "CONFLICT",
] as const;

export const MDHO_APPROVAL_ERROR_CODES = ["SELF_APPROVAL_FORBIDDEN"] as const;

export const MDHO_ERROR_CODES = [
  ...MDHO_CONFLICT_ERROR_CODES,
  ...MDHO_APPROVAL_ERROR_CODES,
] as const;

export type MdhoConflictErrorCode = (typeof MDHO_CONFLICT_ERROR_CODES)[number];

export type MdhoApprovalErrorCode = (typeof MDHO_APPROVAL_ERROR_CODES)[number];

export type MdhoErrorCode = (typeof MDHO_ERROR_CODES)[number];

export type MdhoConflictError = {
  code: MdhoConflictErrorCode;
  message: string;
  currentStatus?: MdhoAssessmentStatus | OccurrenceStatus;
  assessmentId?: string;
};

export type MdhoApprovalError = {
  code: MdhoApprovalErrorCode;
  message: string;
};

export type MdhoDomainError = MdhoConflictError | MdhoApprovalError;

export function isMdhoAssessmentStatus(value: string): value is MdhoAssessmentStatus {
  return (MDHO_ASSESSMENT_STATUSES as readonly string[]).includes(value);
}

export function isMdhoConflictErrorCode(value: string): value is MdhoConflictErrorCode {
  return (MDHO_CONFLICT_ERROR_CODES as readonly string[]).includes(value);
}

export function isMdhoApprovalErrorCode(value: string): value is MdhoApprovalErrorCode {
  return (MDHO_APPROVAL_ERROR_CODES as readonly string[]).includes(value);
}

export function isMdhoErrorCode(value: string): value is MdhoErrorCode {
  return (MDHO_ERROR_CODES as readonly string[]).includes(value);
}

/** Snapshot mínimo para guards de elegibilidade / start (PO-MDHO-2, PO-MDHO-4). */
export type MdhoEligibilityOccurrence = {
  status: OccurrenceStatus;
  decisionType: OccurrenceDecisionType | null;
  hasMdhoAssessment?: boolean;
};

/**
 * Ramo IO confirmado, sem assessment — pré-condição de `start_mdho_assessment`.
 */
export function isMdhoEligible(occurrence: MdhoEligibilityOccurrence): boolean {
  if (occurrence.decisionType !== "INTERDICAO_OFICIAL") {
    return false;
  }

  if (occurrence.status !== "INTERDICAO_CONFIRMADA") {
    return false;
  }

  return occurrence.hasMdhoAssessment !== true;
}

export function isMdhoEditableStatus(status: MdhoAssessmentStatus): boolean {
  return status === "DRAFT" || status === "RETURNED";
}

const MDHO_IO_SECTION_STATUSES = [
  "INTERDICAO_CONFIRMADA",
  "MDHO_EM_PREENCHIMENTO",
  "AGUARDANDO_APROVACAO_HSE",
  "AGUARDANDO_REGISTRO_IMS",
] as const satisfies readonly OccurrenceStatus[];

/**
 * Seção MDHO visível no detalhe IO (PO-CON-8 / S29-TYP-01).
 */
export function shouldShowMdhoSection(occurrence: {
  decisionType: OccurrenceDecisionType | null;
  status: OccurrenceStatus;
}): boolean {
  if (occurrence.decisionType !== "INTERDICAO_OFICIAL") {
    return false;
  }

  return (MDHO_IO_SECTION_STATUSES as readonly OccurrenceStatus[]).includes(occurrence.status);
}
