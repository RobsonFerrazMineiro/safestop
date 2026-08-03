import { Pressable, StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";

import {
  formatOccurrenceDate,
  getOccurrenceStatusLabel,
} from "@/features/occurrences/utils/occurrence-labels";

import { IMS_REFERENCE_COPY } from "../utils/ims-reference-copy";

type ImsReferenceCardProps = {
  occurrence: OccurrenceDetails;
  canUpdate: boolean;
  onEdit: () => void;
};

export function ImsReferenceCard({ occurrence, canUpdate, onEdit }: ImsReferenceCardProps) {
  const code = occurrence.imsReferenceCode?.trim() ?? "—";

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{getOccurrenceStatusLabel(occurrence.status)}</Text>
      </View>

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
        <Pressable
          accessibilityLabel={IMS_REFERENCE_COPY.editCta}
          accessibilityRole="button"
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          onPress={onEdit}
        >
          <Text style={styles.editText}>{IMS_REFERENCE_COPY.editCta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#1E3A5F",
    borderRadius: 999,
    color: "#BFDBFE",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  badgeRow: {
    flexDirection: "row",
  },
  code: {
    color: "#F9FAFB",
    fontFamily: "monospace",
    fontSize: 20,
    fontWeight: "700",
  },
  container: {
    backgroundColor: "#111827",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  editButton: {
    alignItems: "center",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  editText: {
    color: "#D1D5DB",
    fontSize: 15,
    fontWeight: "600",
  },
  field: {
    gap: 4,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
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
  pressed: {
    opacity: 0.85,
  },
});
