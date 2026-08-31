import { Bell } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

import { NOTIFICATION_COPY } from "../utils/notification-copy";

const EMPTY_ICON_SIZE = 28;

export function NotificationEmpty() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Bell
        accessible={false}
        color={colors.foregroundMuted}
        size={EMPTY_ICON_SIZE}
        strokeWidth={1.75}
      />
      <Text style={styles.title}>{NOTIFICATION_COPY.empty}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexGrow: 1,
    gap: spacing[3],
    justifyContent: "center",
    paddingVertical: spacing[10],
  },
  title: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
    textAlign: "center",
  },
});
