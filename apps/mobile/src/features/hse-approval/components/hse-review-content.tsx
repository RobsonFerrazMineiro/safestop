import type { MdhoCatalogCategory } from "@safestop/types";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, statusChip, typography } from "@safestop/ui";

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
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  mdhoHeading: {
    borderTopColor: statusChip.warning.border,
    borderTopWidth: 1,
    color: statusChip.warning.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    paddingTop: spacing[3],
    textTransform: "uppercase",
  },
  metaField: {
    flex: 1,
    gap: spacing[1],
  },
  metaLabel: {
    color: statusChip.warning.foreground,
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
  sectionTitle: {
    color: statusChip.warning.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  selfApprovalInfo: {
    color: statusChip.warning.foreground,
    fontSize: typography.helper.fontSize,
  },
  status: {
    color: statusChip.warning.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
});
