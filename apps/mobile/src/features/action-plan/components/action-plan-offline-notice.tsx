import { StyleSheet, Text, View } from "react-native";
import { statusChip, spacing, typography } from "@safestop/ui";

import { ACTION_PLAN_COPY } from "../utils/action-plan-copy";

export function ActionPlanOfflineNotice() {
  return (
    <View accessibilityRole="text" style={styles.banner}>
      <Text style={styles.text}>{ACTION_PLAN_COPY.offline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  text: {
    color: statusChip.warning.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    lineHeight: 18,
  },
});
