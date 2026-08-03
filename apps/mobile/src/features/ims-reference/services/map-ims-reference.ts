import {
  isOccurrenceStatus,
  type ImsReferenceOccurrenceSnapshot,
  type RegisterImsReferenceResult,
  type UpdateImsReferenceResult,
} from "@safestop/types";

type RpcOccurrenceSnapshot = {
  id: string;
  status: string;
  ims_reference_code: string;
  ims_reference_registered_at?: string;
  ims_reference_registered_by?: string;
  ims_reference_updated_at?: string;
  ims_reference_updated_by?: string;
  previous_ims_reference_code?: string;
};

type RpcRegisterData = {
  occurrence: RpcOccurrenceSnapshot;
  idempotent?: boolean;
};

type RpcUpdateData = {
  occurrence: RpcOccurrenceSnapshot;
};

function mapOccurrenceSnapshot(row: RpcOccurrenceSnapshot): ImsReferenceOccurrenceSnapshot {
  if (!isOccurrenceStatus(row.status)) {
    throw new Error("Status de ocorrência inválido.");
  }

  return {
    id: row.id,
    status: row.status,
    imsReferenceCode: row.ims_reference_code,
    imsReferenceRegisteredAt: row.ims_reference_registered_at,
    imsReferenceRegisteredBy: row.ims_reference_registered_by,
    imsReferenceUpdatedAt: row.ims_reference_updated_at,
    imsReferenceUpdatedBy: row.ims_reference_updated_by,
    previousImsReferenceCode: row.previous_ims_reference_code,
  };
}

export function mapRegisterImsReferenceResult(data: RpcRegisterData): RegisterImsReferenceResult {
  return {
    occurrence: mapOccurrenceSnapshot(data.occurrence),
    idempotent: data.idempotent,
  };
}

export function mapUpdateImsReferenceResult(data: RpcUpdateData): UpdateImsReferenceResult {
  return {
    occurrence: mapOccurrenceSnapshot(data.occurrence),
  };
}
