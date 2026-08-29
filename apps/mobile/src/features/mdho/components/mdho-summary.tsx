import { StyleSheet, Text, View } from "react-native";
import type { MdhoCatalogCategory } from "@safestop/types";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";

import type { MdhoAssessmentEnriched } from "../services/map-mdho";
import { MdhoReadOnlyView } from "./mdho-read-only-view";

type MdhoSummaryProps = {
  assessment: MdhoAssessmentEnriched;
  catalog: MdhoCatalogCategory[];
  hideImsHint?: boolean;
};

export function MdhoSummary({ assessment, catalog, hideImsHint = false }: MdhoSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Aprovado</Text>
      </View>

      <MdhoReadOnlyView assessment={assessment} catalog={catalog} />

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Aprovado por</Text>
          <Text style={styles.metaValue}>{assessment.approvedByName ?? "—"}</Text>
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Em</Text>
          <Text style={styles.metaValue}>
            {assessment.approvedAt ? formatOccurrenceDate(assessment.approvedAt) : "—"}
          </Text>
        </View>
      </View>

      {!hideImsHint ? <Text style={styles.hint}>Aguardando registro da referência IMS</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: statusChip.success.background,
    borderColor: statusChip.success.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  badgeText: {
    color: statusChip.success.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  container: {
    gap: spacing[3],
  },
  hint: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
    fontStyle: "italic",
  },
  metaField: {
    flex: 1,
    gap: spacing[1],
  },
  metaLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing[4],
  },
  metaValue: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
  },
});
