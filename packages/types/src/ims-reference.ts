/**
 * Referência IMS manual (Sprint 2.8).
 * Referência: docs/decisions/IMS-REFERENCE-DECISIONS.md
 * SafeStop não gera nem consulta IMS externo — código digitado manualmente.
 */

import type { OccurrenceDecisionType, OccurrenceStatus } from "./occurrence-status";

/** PO-IMS-1 — formato BAA-XX-0000 (mínimo 4 dígitos finais). */
export const IMS_REFERENCE_CODE_PATTERN = /^BAA-\d{2}-\d{4,}$/;

export const IMS_UPDATE_REASON_MIN_LENGTH = 10;

export const IMS_UPDATE_REASON_MAX_LENGTH = 4000;

export type RegisterImsReferenceInput = {
  occurrenceId: string;
  imsReferenceCode: string;
};

export type UpdateImsReferenceInput = {
  occurrenceId: string;
  imsReferenceCode: string;
  updateReason: string;
};

export type ImsReferenceOccurrenceSnapshot = {
  id: string;
  status: OccurrenceStatus;
  imsReferenceCode: string;
  imsReferenceRegisteredAt?: string;
  imsReferenceRegisteredBy?: string;
  imsReferenceUpdatedAt?: string;
  imsReferenceUpdatedBy?: string;
  previousImsReferenceCode?: string;
};

export type RegisterImsReferenceResult = {
  occurrence: ImsReferenceOccurrenceSnapshot;
  /** PO-IMS-12 — retry idempotente após sucesso. */
  idempotent?: boolean;
};

export type UpdateImsReferenceResult = {
  occurrence: ImsReferenceOccurrenceSnapshot;
};

/** Erros tratáveis na UI (IMS-REFERENCE-DECISIONS § RPCs). */
export const IMS_REFERENCE_ERROR_CODES = [
  "STATUS_MISMATCH",
  "ALREADY_REGISTERED",
  "CONFLICT",
] as const;

export type ImsReferenceErrorCode = (typeof IMS_REFERENCE_ERROR_CODES)[number];

export type ImsReferenceError = {
  code: ImsReferenceErrorCode;
  message: string;
  currentStatus?: OccurrenceStatus;
  imsReferenceCode?: string;
};

export function isImsReferenceErrorCode(value: string): value is ImsReferenceErrorCode {
  return (IMS_REFERENCE_ERROR_CODES as readonly string[]).includes(value);
}

/** Snapshot mínimo para guard de registro (PO-IMS-2, PO-IMS-11). */
export type ImsRegisterEligibilityOccurrence = {
  status: OccurrenceStatus;
  decisionType: OccurrenceDecisionType | null;
  imsReferenceCode: string | null;
  /** Quando false, bloqueia registro — MDHO deve estar APPROVED. */
  hasMdhoApproved?: boolean;
};

/**
 * Pré-condição UI/RPC de `register_ims_reference`.
 * Ramo IO + AGUARDANDO_REGISTRO_IMS + sem código + MDHO aprovado.
 */
export function isImsRegisterEligible(occurrence: ImsRegisterEligibilityOccurrence): boolean {
  if (occurrence.decisionType !== "INTERDICAO_OFICIAL") {
    return false;
  }

  if (occurrence.status !== "AGUARDANDO_REGISTRO_IMS") {
    return false;
  }

  if (occurrence.imsReferenceCode !== null && occurrence.imsReferenceCode.trim() !== "") {
    return false;
  }

  if (occurrence.hasMdhoApproved === false) {
    return false;
  }

  return true;
}

export function isValidImsReferenceCode(value: string): boolean {
  return IMS_REFERENCE_CODE_PATTERN.test(value.trim());
}

const IMS_TERMINAL_STATUSES = ["ENCERRADA", "LIBERADA", "CANCELADA"] as const;

export type ImsReferencePermissions = {
  imsRegister: boolean;
  imsUpdate: boolean;
};

export type ImsReferenceGuardContext = {
  isPlatformAdmin: boolean;
  permissions: ImsReferencePermissions;
};

export function shouldShowImsReferenceSection(occurrence: {
  decisionType: OccurrenceDecisionType | null;
  status: OccurrenceStatus;
  imsReferenceCode: string | null;
}): boolean {
  if (occurrence.decisionType !== "INTERDICAO_OFICIAL") {
    return false;
  }

  if (occurrence.imsReferenceCode !== null && occurrence.imsReferenceCode.trim() !== "") {
    return true;
  }

  return occurrence.status === "AGUARDANDO_REGISTRO_IMS";
}

export function canRegisterImsReference(input: {
  occurrence: ImsRegisterEligibilityOccurrence;
  context: ImsReferenceGuardContext;
}): boolean {
  if (input.context.isPlatformAdmin) {
    return false;
  }

  if (!input.context.permissions.imsRegister) {
    return false;
  }

  return isImsRegisterEligible(input.occurrence);
}

export function canUpdateImsReference(input: {
  occurrence: {
    status: OccurrenceStatus;
    imsReferenceCode: string | null;
  };
  context: ImsReferenceGuardContext;
}): boolean {
  if (input.context.isPlatformAdmin) {
    return false;
  }

  if (!input.context.permissions.imsUpdate) {
    return false;
  }

  if (
    input.occurrence.imsReferenceCode === null ||
    input.occurrence.imsReferenceCode.trim() === ""
  ) {
    return false;
  }

  return !(IMS_TERMINAL_STATUSES as readonly string[]).includes(input.occurrence.status);
}
