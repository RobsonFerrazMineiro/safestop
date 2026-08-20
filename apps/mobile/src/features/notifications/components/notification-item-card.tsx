import type { NotificationListItem } from "@safestop/types";
import { isNotificationUnread, requiresNotificationAwareness } from "@safestop/types";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { formatRelativeTime } from "@/features/hse-approval/utils/format-relative-time";

import { NOTIFICATION_COPY, NOTIFICATION_PRIORITY_LABELS } from "../utils/notification-copy";

type NotificationItemCardProps = {
  item: NotificationListItem;
  isOnline: boolean;
  canConfirmAwareness: boolean;
  isMarkingRead: boolean;
  isConfirming: boolean;
  confirmingId: string | null;
  onOpen: (item: NotificationListItem) => void;
  onConfirmAwareness: (item: NotificationListItem) => void;
};

function getPriorityColor(priority: NotificationListItem["priority"]): string {
  switch (priority) {
    case "CRITICAL":
      return "#F87171";
    case "HIGH":
      return "#FB923C";
    case "MEDIUM":
      return "#60A5FA";
    case "LOW":
      return "#9CA3AF";
    default:
      return "#9CA3AF";
  }
}

export function NotificationItemCard({
  item,
  isOnline,
  canConfirmAwareness,
  isMarkingRead,
  isConfirming,
  confirmingId,
  onOpen,
  onConfirmAwareness,
}: NotificationItemCardProps) {
  const unread = isNotificationUnread(item);
  const pendingAwareness = requiresNotificationAwareness(item);
  const showAwarenessCta = pendingAwareness && canConfirmAwareness;
  const isBusy = isMarkingRead || (isConfirming && confirmingId === item.id);
  const priorityLabel = NOTIFICATION_PRIORITY_LABELS[item.priority];

  return (
    <View accessibilityRole="none" style={styles.container}>
      <Pressable
        accessibilityLabel={`${item.title}. ${item.message}`}
        accessibilityRole="button"
        disabled={isBusy}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        onPress={() => {
          onOpen(item);
        }}
      >
        <View style={styles.header}>
          <View
            style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]}
          />
          <Text
            accessibilityRole="header"
            style={[styles.title, unread && styles.titleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>

        <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.srOnly}>
          {NOTIFICATION_COPY.prioritySr(priorityLabel)}
        </Text>

        <Text numberOfLines={2} style={styles.message}>
          {item.message}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatRelativeTime(item.createdAt)}</Text>
          {unread ? <Text style={styles.unreadChip}>{NOTIFICATION_COPY.unreadChip}</Text> : null}
          {item.requiresAwareness ? (
            pendingAwareness ? (
              <Text style={styles.pendingChip}>{NOTIFICATION_COPY.pendingAwarenessChip}</Text>
            ) : (
              <Text style={styles.confirmedChip}>{NOTIFICATION_COPY.confirmedAwarenessChip}</Text>
            )
          ) : null}
        </View>
      </Pressable>

      {showAwarenessCta ? (
        <Pressable
          accessibilityLabel={NOTIFICATION_COPY.confirmAwarenessCta}
          accessibilityRole="button"
          disabled={!isOnline || isBusy}
          style={({ pressed }) => [
            styles.awarenessButton,
            (!isOnline || isBusy) && styles.awarenessButtonDisabled,
            pressed && isOnline && !isBusy && styles.pressed,
          ]}
          onPress={() => {
            onConfirmAwareness(item);
          }}
        >
          {isConfirming && confirmingId === item.id ? (
            <ActivityIndicator color="#FFFBEB" size="small" />
          ) : (
            <Text style={styles.awarenessButtonText}>{NOTIFICATION_COPY.confirmAwarenessCta}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  awarenessButton: {
    alignItems: "center",
    backgroundColor: "#D97706",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  awarenessButtonDisabled: {
    opacity: 0.5,
  },
  awarenessButtonText: {
    color: "#FFFBEB",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    gap: 6,
    padding: 14,
  },
  confirmedChip: {
    backgroundColor: "#14532D",
    borderRadius: 999,
    color: "#86EFAC",
    fontSize: 11,
    fontWeight: "600",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  container: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  message: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pendingChip: {
    backgroundColor: "#78350F",
    borderRadius: 999,
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "600",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  priorityDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  srOnly: {
    height: 0,
    opacity: 0,
    position: "absolute",
    width: 0,
  },
  title: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  titleUnread: {
    fontWeight: "700",
  },
  unreadChip: {
    backgroundColor: "#374151",
    borderRadius: 999,
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "600",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
