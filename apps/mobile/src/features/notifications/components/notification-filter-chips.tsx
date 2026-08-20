import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import {
  NOTIFICATION_LIST_FILTERS,
  type NotificationListFilter,
} from "../utils/notification-filters";
import { NOTIFICATION_COPY } from "../utils/notification-copy";

const FILTER_LABELS: Record<NotificationListFilter, string> = {
  all: NOTIFICATION_COPY.filterAll,
  unread: NOTIFICATION_COPY.filterUnread,
  pendingAwareness: NOTIFICATION_COPY.filterPendingAwareness,
  critical: NOTIFICATION_COPY.filterCritical,
  interdiction: NOTIFICATION_COPY.filterInterdiction,
  verAndAct: NOTIFICATION_COPY.filterVerAndAct,
};

type NotificationFilterChipsProps = {
  activeFilter: NotificationListFilter;
  onChange: (filter: NotificationListFilter) => void;
};

export function NotificationFilterChips({ activeFilter, onChange }: NotificationFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      accessibilityRole="tablist"
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
    >
      {NOTIFICATION_LIST_FILTERS.map((filter) => {
        const isActive = filter === activeFilter;

        return (
          <Pressable
            key={filter}
            accessibilityLabel={FILTER_LABELS[filter]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              onChange(filter);
            }}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {FILTER_LABELS[filter]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#92400E",
    borderColor: "#D97706",
  },
  chipText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FDE68A",
  },
  content: {
    gap: 8,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
