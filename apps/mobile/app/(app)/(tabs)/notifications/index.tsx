import { useLocalSearchParams } from "expo-router";

import { NotificationsListScreen } from "@/features/notifications";
import { parseNotificationListFilter } from "@/features/notifications/utils/notification-filters";

export default function NotificationsRoute() {
  const { filter } = useLocalSearchParams<{ filter?: string | string[] }>();
  const initialFilter = parseNotificationListFilter(filter);

  return <NotificationsListScreen initialFilter={initialFilter} />;
}
