import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

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

const INACTIVE_CHIP = statusChip.muted;
const ACTIVE_CHIP = statusChip.warning;

type NotificationFilterChipsProps = {
  activeFilter: NotificationListFilter;
  onChange: (filter: NotificationListFilter) => void;
};

export function NotificationFilterChips({ activeFilter, onChange }: NotificationFilterChipsProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        accessibilityRole="tablist"
        contentContainerStyle={styles.content}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {NOTIFICATION_LIST_FILTERS.map((filter) => {
          const isActive = filter === activeFilter;
          const chipTone = isActive ? ACTIVE_CHIP : INACTIVE_CHIP;

          return (
            <Pressable
              key={filter}
              accessibilityLabel={FILTER_LABELS[filter]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: chipTone.background,
                  borderColor: chipTone.border,
                },
                pressed && styles.pressed,
              ]}
              onPress={() => {
                onChange(filter);
              }}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.chipText,
                  { color: isActive ? chipTone.foreground : colors.foregroundMuted },
                ]}
              >
                {FILTER_LABELS[filter]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[4],
  },
  chipText: {
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
  },
  pressed: {
    opacity: 0.85,
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  wrapper: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
