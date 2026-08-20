import { StyleSheet, Text, View } from "react-native";

import { NOTIFICATION_COPY } from "../utils/notification-copy";

export function NotificationEmpty() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Text style={styles.icon}>🔔</Text>
      <Text style={styles.message}>{NOTIFICATION_COPY.empty}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 48,
  },
  icon: {
    fontSize: 32,
  },
  message: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
  },
});
