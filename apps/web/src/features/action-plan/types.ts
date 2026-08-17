import {
  ACTION_PLAN_STALE_TIME_MS,
  type ActionItem,
  type ActionItemAttachment,
  type ActionItemPriority,
  type ActionPlan,
} from "@safestop/types";

export { ACTION_PLAN_STALE_TIME_MS };

export type ActionPlanEnriched = ActionPlan;

export type ActionItemEnriched = ActionItem & {
  responsibleMemberName: string | null;
  responsibleOrganizationName: string | null;
  completedByName: string | null;
};

export type ActionItemAttachmentEnriched = ActionItemAttachment;

export type OrganizationMemberOption = {
  id: string;
  profileId: string;
  fullName: string | null;
};

export type AddActionItemInput = {
  actionPlanId: string;
  title: string;
  description: string;
  responsibleMemberId: string;
  responsibleOrganizationId?: string;
  dueAt: string;
  priority: ActionItemPriority;
};
