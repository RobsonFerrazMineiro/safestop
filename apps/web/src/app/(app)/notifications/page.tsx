import { Suspense } from "react";

import { NotificationCenterContainer } from "@/features/notifications";
import { NotificationLoadingSkeleton } from "@/features/notifications/components/notification-states";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationLoadingSkeleton />}>
      <NotificationCenterContainer />
    </Suspense>
  );
}
