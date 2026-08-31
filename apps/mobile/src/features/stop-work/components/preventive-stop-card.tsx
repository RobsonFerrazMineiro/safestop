import type { OccurrenceSummary } from "@safestop/types";
import { useRouter } from "expo-router";
import { Building2, MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

import { Card, StatusBadge } from "@/components/ui";
import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";
import { stopWorkDetailRoute } from "@/lib/auth/routes";

type PreventiveStopCardProps = {
  preventiveStop: OccurrenceSummary;
};

export function PreventiveStopCard({ preventiveStop }: PreventiveStopCardProps) {
  const router = useRouter();

  return (
    <Card
      accessibilityLabel={`Paralisação ${preventiveStop.publicCode}`}
      style={styles.card}
      variant="muted"
      onPress={() => {
        router.push(stopWorkDetailRoute(preventiveStop.id));
      }}
    >
      <View style={styles.topRow}>
        <Text numberOfLines={1} style={styles.code}>
          {preventiveStop.publicCode}
        </Text>
        <StatusBadge severity={preventiveStop.severity} />
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {preventiveStop.title}
      </Text>

      <View style={styles.badgeRow}>
        <StatusBadge status={preventiveStop.status} />
      </View>

      {preventiveStop.areaName ? (
        <View style={styles.metaRow}>
          <MapPin accessible={false} color={colors.foregroundMuted} size={12} strokeWidth={2} />
          <Text numberOfLines={1} style={styles.metaText}>
            {preventiveStop.areaName}
          </Text>
        </View>
      ) : null}

      {preventiveStop.contractorOrganizationName ? (
        <View style={styles.metaRow}>
          <Building2 accessible={false} color={colors.foregroundMuted} size={12} strokeWidth={2} />
          <Text numberOfLines={1} style={styles.metaText}>
            {preventiveStop.contractorOrganizationName}
          </Text>
        </View>
      ) : null}

      <Text style={styles.date}>{formatOccurrenceDate(preventiveStop.createdAt)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
  },
  card: {
    gap: spacing[1],
    padding: spacing[3],
  },
  code: {
    color: colors.primary,
    flex: 1,
    fontFamily: "monospace",
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
  date: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    marginTop: spacing[1] / 2,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1],
  },
  metaText: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.caption.fontSize,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    lineHeight: 18,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between",
  },
});
