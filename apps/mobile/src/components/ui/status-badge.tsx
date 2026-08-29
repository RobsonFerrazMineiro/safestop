import type { OccurrenceSeverity, OccurrenceStatus } from "@safestop/types";
import { StyleSheet, Text, View } from "react-native";
import {
  getOccurrenceSeverityChip,
  getOccurrenceStatusChip,
  radius,
  type OccurrenceSeverityTokenKey,
  type OccurrenceStatusTokenKey,
} from "@safestop/ui";

import {
  getOccurrenceSeverityLabel,
  getOccurrenceStatusLabel,
} from "@/features/occurrences/utils/occurrence-labels";

type StatusBadgeStatusProps = {
  status: OccurrenceStatus;
  severity?: never;
  label?: string;
};

type StatusBadgeSeverityProps = {
  severity: OccurrenceSeverity;
  status?: never;
  label?: string;
};

export type StatusBadgeProps = StatusBadgeStatusProps | StatusBadgeSeverityProps;

export function StatusBadge(props: StatusBadgeProps) {
  const tone =
    props.status !== undefined
      ? getOccurrenceStatusChip(props.status as OccurrenceStatusTokenKey)
      : getOccurrenceSeverityChip(props.severity as OccurrenceSeverityTokenKey);

  const label =
    props.label ??
    (props.status !== undefined
      ? getOccurrenceStatusLabel(props.status)
      : getOccurrenceSeverityLabel(props.severity));

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="text"
      style={[
        styles.badge,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: tone.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.badge,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
