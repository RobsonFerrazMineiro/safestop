import type { OccurrenceDetails, OccurrenceStatus } from "@safestop/types";
import { isImsRegisterEligible } from "@safestop/types";

const TERMINAL_STATUSES = new Set<OccurrenceStatus>(["ENCERRADA", "LIBERADA", "CANCELADA"]);

const IMS_IO_STATUSES = new Set<OccurrenceStatus>([
  "AGUARDANDO_REGISTRO_IMS",
  "EM_TRATATIVA",
  "AGUARDANDO_VALIDACAO",
  "LIBERADA",
  "ENCERRADA",
]);

export function shouldShowImsReferenceSection(occurrence: OccurrenceDetails): boolean {
  if (occurrence.decisionType !== "INTERDICAO_OFICIAL") {
    return false;
  }

  if (occurrence.imsReferenceCode && occurrence.imsReferenceCode.trim() !== "") {
    return true;
  }

  return IMS_IO_STATUSES.has(occurrence.status);
}

export function canRegisterImsReference(params: {
  canRegister: boolean;
  isPlatformAdmin: boolean;
  occurrence: OccurrenceDetails;
}): boolean {
  if (!params.canRegister || params.isPlatformAdmin) {
    return false;
  }

  return isImsRegisterEligible({
    status: params.occurrence.status,
    decisionType: params.occurrence.decisionType,
    imsReferenceCode: params.occurrence.imsReferenceCode,
  });
}

export function canUpdateImsReference(params: {
  canUpdate: boolean;
  isPlatformAdmin: boolean;
  occurrence: OccurrenceDetails;
}): boolean {
  if (!params.canUpdate || params.isPlatformAdmin) {
    return false;
  }

  const code = params.occurrence.imsReferenceCode?.trim();

  if (!code) {
    return false;
  }

  return !TERMINAL_STATUSES.has(params.occurrence.status);
}
