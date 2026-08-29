import { StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";
import { colors, typography } from "@safestop/ui";

import { Button, Card, StatusBadge } from "@/components/ui";
import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";

import { IMS_REFERENCE_COPY } from "../utils/ims-reference-copy";

type ImsReferenceCardProps = {
  occurrence: OccurrenceDetails;
  canUpdate: boolean;
  onEdit: () => void;
};

export function ImsReferenceCard({ occurrence, canUpdate, onEdit }: ImsReferenceCardProps) {
  const code = occurrence.imsReferenceCode?.trim() ?? "—";

  return (
    <Card>
      <StatusBadge status={occurrence.status} />

      <View style={styles.field}>
        <Text style={styles.label}>{IMS_REFERENCE_COPY.codeDisplayLabel}</Text>
        <Text accessibilityRole="text" style={styles.code}>
          {code}
        </Text>
      </View>

      {occurrence.imsReferenceRegisteredByName || occurrence.imsReferenceRegisteredAt ? (
        <View style={styles.metaRow}>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>{IMS_REFERENCE_COPY.registeredByLabel}</Text>
            <Text style={styles.metaValue}>{occurrence.imsReferenceRegisteredByName ?? "—"}</Text>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>{IMS_REFERENCE_COPY.atLabel}</Text>
            <Text style={styles.metaValue}>
              {occurrence.imsReferenceRegisteredAt
                ? formatOccurrenceDate(occurrence.imsReferenceRegisteredAt)
                : "—"}
            </Text>
          </View>
        </View>
      ) : null}

      {occurrence.imsReferenceUpdatedByName || occurrence.imsReferenceUpdatedAt ? (
        <View style={styles.metaRow}>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>{IMS_REFERENCE_COPY.updatedByLabel}</Text>
            <Text style={styles.metaValue}>{occurrence.imsReferenceUpdatedByName ?? "—"}</Text>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>{IMS_REFERENCE_COPY.atLabel}</Text>
            <Text style={styles.metaValue}>
              {occurrence.imsReferenceUpdatedAt
                ? formatOccurrenceDate(occurrence.imsReferenceUpdatedAt)
                : "—"}
            </Text>
          </View>
        </View>
      ) : null}

      {canUpdate ? (
        <Button
          accessibilityLabel={IMS_REFERENCE_COPY.editCta}
          variant="secondary"
          onPress={onEdit}
        >
          {IMS_REFERENCE_COPY.editCta}
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  code: {
    color: colors.foreground,
    fontFamily: "monospace",
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "700",
  },
  field: {
    gap: 4,
  },
  label: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaField: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaValue: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
  },
});
