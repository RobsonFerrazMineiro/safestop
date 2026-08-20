import { useMutation } from "@tanstack/react-query";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { markAllNotificationsRead } from "../services/mark-all-notifications-read";
import { useInvalidateNotificationCaches } from "./use-invalidate-notification-caches";

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotificationCaches();
  const { activeOrganization } = useActiveOrganization();

  const mutation = useMutation({
    mutationFn: async () => {
      const organizationId = activeOrganization?.id;

      if (!organizationId) {
        throw new Error("Organização ativa não encontrada.");
      }

      return markAllNotificationsRead(organizationId);
    },
    onSuccess: async () => {
      await invalidate("readAll");
    },
  });

  return {
    markAllRead: mutation.mutateAsync,
    isMarkingAll: mutation.isPending,
  };
}
