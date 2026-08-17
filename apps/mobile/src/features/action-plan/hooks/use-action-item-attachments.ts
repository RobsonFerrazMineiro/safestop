import { useQuery } from "@tanstack/react-query";
import { ACTION_PLAN_STALE_TIME_MS } from "@safestop/types";
import { actionPlanKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { getActionItemAttachments } from "../services/get-action-item-attachments";

export function useActionItemAttachments(itemId: string | null) {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const query = useQuery({
    queryKey: actionPlanKeys.attachments(organizationId ?? "", itemId ?? ""),
    queryFn: () => getActionItemAttachments(itemId!),
    enabled: !!organizationId && !!itemId,
    staleTime: ACTION_PLAN_STALE_TIME_MS,
  });

  const completedCount =
    query.data?.filter((attachment) => attachment.uploadStatus === "COMPLETED").length ?? 0;

  return {
    attachments: query.data ?? [],
    completedCount,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
