export type OccurrenceParticipantType =
  | "REPORTER"
  | "EVALUATOR"
  | "CONTRACTOR_LEADER"
  | "CONTRACT_INSPECTOR"
  | "HSE_SUPERVISOR"
  | "HSE_APPROVER"
  | "AREA_MANAGER"
  | "ACTION_OWNER"
  | "RELEASE_APPROVER"
  | "OBSERVER"
  | "ACTIVITY_FOREMAN";

export type OccurrenceParticipantItem = {
  id: string;
  participantType: OccurrenceParticipantType;
  isPrimary: boolean;
  memberName: string | null;
};
