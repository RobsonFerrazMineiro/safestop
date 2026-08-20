import { useMutation } from "@tanstack/react-query";

import { confirmNotificationAwareness } from "../services/confirm-notification-awareness";
import { useInvalidateNotificationCaches } from "./use-invalidate-notification-caches";

export function useConfirmNotificationAwareness() {
  const invalidate = useInvalidateNotificationCaches();

  const mutation = useMutation({
    mutationFn: confirmNotificationAwareness,
    onSuccess: async () => {
      await invalidate("awareness");
    },
  });

  return {
    confirmAwareness: mutation.mutateAsync,
    isConfirming: mutation.isPending,
  };
}
