import { StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    color: "#93C5FD",
    fontSize: 13,
    lineHeight: 18,
  },
});
