import { StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "#422006",
    borderColor: "#D97706",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    color: "#FDE68A",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
