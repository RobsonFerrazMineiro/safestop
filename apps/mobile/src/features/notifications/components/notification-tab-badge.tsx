import { StyleSheet, Text, View } from "react-native";

import type { NotificationBadgeCounts } from "../types";
import { NOTIFICATION_COPY } from "../utils/notification-copy";

type NotificationTabBadgeProps = {
  counts: NotificationBadgeCounts;
};

export function NotificationTabBadge({ counts }: NotificationTabBadgeProps) {
  const showUnread = counts.unreadCount > 0;
  const showAwareness = counts.pendingAwarenessCount > 0;

  if (!showUnread && !showAwareness) {
    return null;
  }

  const unreadLabel = counts.unreadCount > 99 ? "99+" : String(counts.unreadCount);

  return (
    <View style={styles.container}>
      {showUnread ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unreadLabel}</Text>
        </View>
      ) : null}
      {showAwareness ? <View style={styles.awarenessDot} /> : null}
    </View>
  );
}

export function getNotificationAccessibilityLabel(counts: NotificationBadgeCounts): string {
  return NOTIFICATION_COPY.accessibilityLabel(counts.unreadCount, counts.pendingAwarenessCount);
}

const styles = StyleSheet.create({
  awarenessDot: {
    backgroundColor: "#FBBF24",
    borderColor: "#0F1115",
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: -2,
    top: -2,
    width: 10,
  },
  container: {
    height: 18,
    justifyContent: "center",
    minWidth: 18,
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 4,
  },
  unreadText: {
    color: "#0F1115",
    fontSize: 10,
    fontWeight: "700",
  },
});
