import type { MdhoCatalogCategory } from "@safestop/types";
import { StyleSheet, Text, View } from "react-native";

import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";
import { MdhoReadOnlyView } from "@/features/mdho/components/mdho-read-only-view";
import type { MdhoAssessmentEnriched } from "@/features/mdho/services/map-mdho";

import { HSE_APPROVAL_COPY } from "../utils/hse-approval-copy";

type HseReviewContentProps = {
  assessment: MdhoAssessmentEnriched;
  catalog: MdhoCatalogCategory[];
  showSelfApprovalInfo?: boolean;
};

export function HseReviewContent({
  assessment,
  catalog,
  showSelfApprovalInfo = false,
}: HseReviewContentProps) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {HSE_APPROVAL_COPY.reviewSectionTitle}
      </Text>
      <Text style={styles.status}>{HSE_APPROVAL_COPY.reviewStatus}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>{HSE_APPROVAL_COPY.submittedByLabel}</Text>
          <Text style={styles.metaValue}>{assessment.submittedByName ?? "—"}</Text>
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>{HSE_APPROVAL_COPY.submittedAtLabel}</Text>
          <Text style={styles.metaValue}>
            {assessment.submittedAt ? formatOccurrenceDate(assessment.submittedAt) : "—"}
          </Text>
        </View>
      </View>

      <Text style={styles.mdhoHeading}>Avaliação Técnica (MDHO)</Text>
      <MdhoReadOnlyView assessment={assessment} catalog={catalog} />

      {showSelfApprovalInfo ? (
        <Text style={styles.selfApprovalInfo}>{HSE_APPROVAL_COPY.selfApprovalInfo}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#422006",
    borderColor: "#D97706",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  mdhoHeading: {
    borderTopColor: "#92400E",
    borderTopWidth: 1,
    color: "#FDE68A",
    fontSize: 12,
    fontWeight: "700",
    paddingTop: 12,
    textTransform: "uppercase",
  },
  metaField: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    color: "#FCD34D",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaValue: {
    color: "#FFFBEB",
    fontSize: 15,
  },
  sectionTitle: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  selfApprovalInfo: {
    color: "#FCD34D",
    fontSize: 13,
  },
  status: {
    color: "#FDE68A",
    fontSize: 14,
    fontWeight: "600",
  },
});
