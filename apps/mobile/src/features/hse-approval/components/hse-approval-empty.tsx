import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

import { HSE_APPROVAL_COPY } from "../utils/hse-approval-copy";

export function HseApprovalEmpty() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{HSE_APPROVAL_COPY.emptyTitle}</Text>
      <Text style={styles.body}>{HSE_APPROVAL_COPY.emptyBody}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
    lineHeight: 20,
    textAlign: "center",
  },
  container: {
    gap: spacing[2],
    paddingVertical: spacing[8],
  },
  title: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
});
