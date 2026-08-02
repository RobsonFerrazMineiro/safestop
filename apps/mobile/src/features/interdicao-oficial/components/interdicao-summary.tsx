import { StyleSheet, Text, View } from "react-native";
import type { OccurrenceDecision } from "@safestop/types";

import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";

type InterdicaoSummaryProps = {
  decision: OccurrenceDecision;
};

export function InterdicaoSummary({ decision }: InterdicaoSummaryProps) {
  const summaryLabel = `Decisão Interdição Oficial. Justificativa técnica: ${decision.decisionReason}. Decidido por ${decision.decidedByName ?? "—"} em ${formatOccurrenceDate(decision.decidedAt)}.`;

  return (
    <View accessibilityLabel={summaryLabel} accessibilityRole="text" style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Interdição Oficial</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Justificativa técnica</Text>
        <Text selectable style={styles.fieldValue}>
          {decision.decisionReason}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.fieldLabel}>Decidido por</Text>
          <Text style={styles.fieldValue}>{decision.decidedByName ?? "—"}</Text>
        </View>
        <View style={styles.metaField}>
          <Text style={styles.fieldLabel}>Em</Text>
          <Text style={styles.fieldValue}>{formatOccurrenceDate(decision.decidedAt)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#7F1D1D",
    borderColor: "#DC2626",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#FEE2E2",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  container: {
    gap: 12,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: "#F9FAFB",
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    color: "#9CA3AF",
    fontSize: 14,
    fontStyle: "italic",
  },
  metaField: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
});
