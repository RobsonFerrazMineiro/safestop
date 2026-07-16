import { StyleSheet, Text, View } from "react-native";

import type { OccurrenceSyncStatus } from "../types";
import { getOccurrenceSyncStatusLabel } from "../utils/occurrence-labels";

type OccurrenceSyncStatusBadgeProps = {
  status: OccurrenceSyncStatus;
};

export function OccurrenceSyncStatusBadge({ status }: OccurrenceSyncStatusBadgeProps) {
  const isLocal = status === "saved_locally";

  return (
    <View
      accessibilityLabel={getOccurrenceSyncStatusLabel(status)}
      style={[styles.badge, isLocal ? styles.localBadge : styles.serverBadge]}
    >
      <Text style={[styles.text, isLocal ? styles.localText : styles.serverText]}>
        {getOccurrenceSyncStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  localBadge: {
    backgroundColor: "#374151",
  },
  serverBadge: {
    backgroundColor: "#14532D",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  localText: {
    color: "#D1D5DB",
  },
  serverText: {
    color: "#BBF7D0",
  },
});
