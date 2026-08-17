"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  canCompleteActionPlan,
  canCreateActionPlan,
  canManageActionPlan,
  canSubmitActionItem,
  canValidateActionItem,
  isActionPlanActiveStatus,
  shouldShowActionPlanSection,
  type ActionPlanGuardContext,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useAuth } from "@/hooks/use-auth";
import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";

import type { ActionItemEnriched, ActionPlanEnriched } from "../types";

function subscribeOnlineStatus(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

export function useActionPlanContext(
  occurrence: Pick<OccurrenceDetailsEnriched, "status" | "decisionType" | "imsReferenceCode">,
  plan: ActionPlanEnriched | null,
  items: ActionItemEnriched[],
) {
  const { can, isPlatformAdmin } = useAuthorization();
  const { user } = useAuth();
  const { activeOrganization } = useActiveOrganization();
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  const currentMemberId = activeOrganization?.organizationMemberId ?? "";
  const hasActivePlan = plan !== null && isActionPlanActiveStatus(plan.status);

  const guardContext = useMemo<ActionPlanGuardContext>(
    () => ({
      isPlatformAdmin,
      permissions: {
        actionPlanCreate: can("action_plan.create"),
        actionPlanManage: can("action_plan.manage"),
        actionPlanValidate: can("action_plan.validate"),
      },
      hasActivePlan,
      isResponsibleMember: items.some((item) => item.responsibleMemberId === currentMemberId),
    }),
    [can, currentMemberId, hasActivePlan, isPlatformAdmin, items],
  );

  const shouldRenderSection = shouldShowActionPlanSection(occurrence);

  const canCreate = canCreateActionPlan({ occurrence, context: guardContext });
  const canManage = canManageActionPlan(guardContext);
  const canComplete =
    plan !== null
      ? canCompleteActionPlan({ plan: { status: plan.status }, context: guardContext })
      : false;

  const canValidateItem = (item: ActionItemEnriched) =>
    canValidateActionItem({
      item: { status: item.status, completedBy: item.completedBy },
      currentUserId: user?.id ?? "",
      context: guardContext,
    });

  const canSubmitItem = (item: ActionItemEnriched) => {
    const isResponsible = item.responsibleMemberId === currentMemberId;
    return canSubmitActionItem({
      item: { status: item.status },
      context: {
        ...guardContext,
        isResponsibleMember: isResponsible,
      },
    });
  };

  const isItemResponsible = (item: ActionItemEnriched) =>
    item.responsibleMemberId === currentMemberId;

  return {
    shouldRenderSection,
    canCreate,
    canManage,
    canComplete,
    canValidateItem,
    canSubmitItem,
    isItemResponsible,
    isOffline: !isOnline,
    guardContext,
    currentMemberId,
    currentUserId: user?.id ?? "",
  };
}

export { shouldShowActionPlanSection };
