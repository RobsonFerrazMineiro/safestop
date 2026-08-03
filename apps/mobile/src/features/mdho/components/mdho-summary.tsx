import { StyleSheet, Text, View } from "react-native";

import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";

import type { MdhoAssessmentEnriched } from "../services/map-mdho";
import { MdhoReadOnlyView } from "./mdho-read-only-view";
import type { MdhoCatalogCategory } from "@safestop/types";

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
    backgroundColor: "#14532D",
    borderColor: "#16A34A",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#BBF7D0",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  container: {
    gap: 12,
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
  metaLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaValue: {
    color: "#F9FAFB",
    fontSize: 15,
  },
});
