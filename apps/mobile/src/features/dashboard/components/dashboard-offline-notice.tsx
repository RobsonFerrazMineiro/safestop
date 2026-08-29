import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

import { DASHBOARD_COPY } from "../utils/dashboard-copy";

export function DashboardOfflineNotice() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Text style={styles.text}>{DASHBOARD_COPY.offline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  text: {
    color: statusChip.info.foreground,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
});
