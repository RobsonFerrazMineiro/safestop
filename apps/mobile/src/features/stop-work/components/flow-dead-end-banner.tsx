import { Info } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { OccurrenceStatus } from "@safestop/types";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

import { CONSOLIDATION_COPY } from "../utils/consolidation-copy";

type FlowDeadEndBannerProps = {
  status: OccurrenceStatus;
  hideTratativa?: boolean;
};

export function FlowDeadEndBanner({ status, hideTratativa = false }: FlowDeadEndBannerProps) {
  if (status === "VER_E_AGIR") {
    return (
      <View accessibilityRole="text" style={styles.banner}>
        <Info accessible={false} color={statusChip.info.foreground} size={16} strokeWidth={2} />
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
        <Info accessible={false} color={statusChip.info.foreground} size={16} strokeWidth={2} />
        <Text style={styles.text}>{CONSOLIDATION_COPY.tratativaDeadEnd}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  text: {
    color: statusChip.info.foreground,
    flex: 1,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
    lineHeight: 18,
  },
});
