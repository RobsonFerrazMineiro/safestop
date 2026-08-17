import {
  ACTION_PLAN_STALE_TIME_MS,
  type ActionItem,
  type ActionItemAttachment,
  type ActionItemPriority,
  type ActionPlan,
} from "@safestop/types";

export { ACTION_PLAN_STALE_TIME_MS };

/** PO-AP-15 — paridade backend (20 ativas por ação). */
export const ACTION_ITEM_ATTACHMENT_MAX_COUNT = 20;

export type ActionPlanEnriched = ActionPlan;

export type ActionItemEnriched = ActionItem & {
  responsibleMemberName: string | null;
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
  description?: string;
  responsibleMemberId: string;
  dueAt: string;
  priority: ActionItemPriority;
};

export type ActionPlanViewMode = "all" | "mine";
