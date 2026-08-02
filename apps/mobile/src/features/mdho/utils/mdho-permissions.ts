import type { MdhoAssessmentStatus, OccurrenceDetails } from "@safestop/types";
import { isMdhoEditableStatus, isMdhoEligible } from "@safestop/types";

const MDHO_IO_STATUSES = new Set([
  "INTERDICAO_CONFIRMADA",
  "MDHO_EM_PREENCHIMENTO",
  "AGUARDANDO_APROVACAO_HSE",
  "AGUARDANDO_REGISTRO_IMS",
]);

export function shouldShowMdhoSection(occurrence: OccurrenceDetails): boolean {
  return (
    occurrence.decisionType === "INTERDICAO_OFICIAL" && MDHO_IO_STATUSES.has(occurrence.status)
  );
}

export function canStartMdho(params: {
  canFill: boolean;
  isPlatformAdmin: boolean;
  occurrence: OccurrenceDetails;
  hasAssessment: boolean;
}): boolean {
  return (
    params.canFill &&
    !params.isPlatformAdmin &&
    isMdhoEligible({
      status: params.occurrence.status,
      decisionType: params.occurrence.decisionType,
      hasMdhoAssessment: params.hasAssessment,
    })
  );
}

export function canEditMdho(params: {
  canFill: boolean;
  isPlatformAdmin: boolean;
  status: MdhoAssessmentStatus | null;
}): boolean {
  return (
    params.canFill &&
    !params.isPlatformAdmin &&
    params.status !== null &&
    isMdhoEditableStatus(params.status)
  );
}

export function canSubmitMdho(params: {
  canSubmit: boolean;
  isPlatformAdmin: boolean;
  status: MdhoAssessmentStatus | null;
}): boolean {
  return (
    params.canSubmit &&
    !params.isPlatformAdmin &&
    params.status !== null &&
    isMdhoEditableStatus(params.status)
  );
}

export function canApproveMdho(params: {
  canApprove: boolean;
  isPlatformAdmin: boolean;
  status: MdhoAssessmentStatus | null;
}): boolean {
  return params.canApprove && !params.isPlatformAdmin && params.status === "SUBMITTED";
}

export function canReturnMdho(params: {
  canReturn: boolean;
  isPlatformAdmin: boolean;
  status: MdhoAssessmentStatus | null;
}): boolean {
  return params.canReturn && !params.isPlatformAdmin && params.status === "SUBMITTED";
}

export function shouldShowMdhoSummary(status: MdhoAssessmentStatus | null): boolean {
  return status === "APPROVED";
}

export function shouldShowMdhoReview(status: MdhoAssessmentStatus | null): boolean {
  return status === "SUBMITTED";
}

export function shouldShowMdhoForm(status: MdhoAssessmentStatus | null): boolean {
  return status !== null && isMdhoEditableStatus(status);
}
