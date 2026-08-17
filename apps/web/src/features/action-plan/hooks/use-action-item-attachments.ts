"use client";

import { useQuery } from "@tanstack/react-query";
import { actionPlanKeys } from "@safestop/query-keys";

import { useAuthorization } from "@/features/authorization";

import { getActionItemAttachments } from "../services/get-action-item-attachments";
import { ACTION_PLAN_STALE_TIME_MS } from "../types";

export function useActionItemAttachments(
  organizationId: string,
  itemId: string | undefined,
  enabled: boolean,
) {
  const { can } = useAuthorization();
  const canRead = can("occurrence.read");
  const queryEnabled =
    enabled && canRead && organizationId.length > 0 && itemId !== undefined && itemId.length > 0;

  const query = useQuery({
    queryKey: actionPlanKeys.attachments(organizationId, itemId ?? ""),
    queryFn: () => getActionItemAttachments(organizationId, itemId!),
    enabled: queryEnabled,
    staleTime: ACTION_PLAN_STALE_TIME_MS,
  });

  const completedAttachments = (query.data ?? []).filter(
    (attachment) => attachment.uploadStatus === "COMPLETED",
  );

  return {
    attachments: query.data ?? [],
    completedAttachments,
    isLoading: queryEnabled && query.isLoading,
    refetch: query.refetch,
  };
}
