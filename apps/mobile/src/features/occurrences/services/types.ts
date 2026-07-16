import type { OccurrenceSeverity, OccurrenceStatus } from "@safestop/types";

export type CreateOccurrenceResult = {
  id: string;
  organizationId: string;
  areaId: string;
  unitId: string | null;
  publicCode: string;
  title: string;
  severity: OccurrenceSeverity;
  status: OccurrenceStatus;
  createdBy: string;
  occurredAt: string;
  createdAt: string;
};

export type CreateOccurrenceRpcResponse = {
  success: boolean;
  data?: {
    id: string;
    organization_id: string;
    area_id: string;
    unit_id: string | null;
    public_code: string;
    title: string;
    severity: string;
    status: string;
    created_by: string;
    occurred_at: string;
    created_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
};
