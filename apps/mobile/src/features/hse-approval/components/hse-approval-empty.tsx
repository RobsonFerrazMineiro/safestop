import { StyleSheet, Text, View } from "react-native";

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
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  container: {
    gap: 8,
    paddingVertical: 32,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
