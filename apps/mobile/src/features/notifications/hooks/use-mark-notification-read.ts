import { useMutation } from "@tanstack/react-query";

import { markNotificationRead } from "../services/mark-notification-read";
import { useInvalidateNotificationCaches } from "./use-invalidate-notification-caches";

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotificationCaches();

  const mutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await invalidate("read");
    },
  });

  return {
    markRead: mutation.mutateAsync,
    isMarking: mutation.isPending,
  };
}
