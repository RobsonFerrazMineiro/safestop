import { StyleSheet, Text, View } from "react-native";
import type { OccurrenceStatus } from "@safestop/types";

import { CONSOLIDATION_COPY } from "../utils/consolidation-copy";

type FlowDeadEndBannerProps = {
  status: OccurrenceStatus;
  hideTratativa?: boolean;
};

export function FlowDeadEndBanner({ status, hideTratativa = false }: FlowDeadEndBannerProps) {
  if (status === "VER_E_AGIR") {
    return (
      <View accessibilityRole="text" style={styles.banner}>
        <Text style={styles.icon}>ℹ</Text>
        <Text style={styles.text}>{CONSOLIDATION_COPY.verEAgirDeadEnd}</Text>
      </View>
    );
  }

  if (status === "EM_TRATATIVA") {
    if (hideTratativa) {
      return null;
    }

    return (
      <View accessibilityRole="text" style={styles.banner}>
        <Text style={styles.icon}>ℹ</Text>
        <Text style={styles.text}>{CONSOLIDATION_COPY.tratativaDeadEnd}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    color: "#93C5FD",
    fontSize: 16,
    fontWeight: "700",
  },
  text: {
    color: "#DBEAFE",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
