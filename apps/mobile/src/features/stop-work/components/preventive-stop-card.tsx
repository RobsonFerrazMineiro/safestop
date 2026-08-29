import type { OccurrenceSummary } from "@safestop/types";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "@safestop/ui";

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
      variant="muted"
      onPress={() => {
        router.push(stopWorkDetailRoute(preventiveStop.id));
      }}
    >
      <View style={styles.header}>
        <Text style={styles.code}>{preventiveStop.publicCode}</Text>
        <StatusBadge severity={preventiveStop.severity} />
      </View>

      <Text style={styles.title}>{preventiveStop.title}</Text>

      <View style={styles.metaRow}>
        <StatusBadge status={preventiveStop.status} />
        {preventiveStop.areaName ? (
          <Text style={styles.area}>· {preventiveStop.areaName}</Text>
        ) : null}
      </View>

      {preventiveStop.contractorOrganizationName ? (
        <Text style={styles.company}>{preventiveStop.contractorOrganizationName}</Text>
      ) : null}

      <Text style={styles.date}>{formatOccurrenceDate(preventiveStop.createdAt)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  area: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.helper.fontSize,
  },
  code: {
    color: colors.primary,
    flex: 1,
    fontFamily: "monospace",
    fontSize: typography.helper.fontSize,
    fontWeight: "700",
  },
  company: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  date: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
});
