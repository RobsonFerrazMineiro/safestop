import type { MdhoPendingApprovalItem } from "@safestop/types";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, statusChip, typography } from "@safestop/ui";

import { Card, StatusBadge } from "@/components/ui";
import { getOccurrenceSeverityLabel } from "@/features/occurrences/utils/occurrence-labels";

import { HSE_APPROVAL_COPY } from "../utils/hse-approval-copy";
import { formatRelativeTime } from "../utils/format-relative-time";

type HsePendingApprovalCardProps = {
  item: MdhoPendingApprovalItem;
};

export function HsePendingApprovalCard({ item }: HsePendingApprovalCardProps) {
  const router = useRouter();
  const submittedBy = item.submittedByName ?? "Supervisor";
  const relativeTime = formatRelativeTime(item.submittedAt);
  const detailHref = `/(app)/stop-work/${item.occurrenceId}?section=mdho-review` as Href;

  return (
    <Card
      accessibilityLabel={`Ocorrência ${item.publicCode}, enviada por ${submittedBy}`}
      style={styles.card}
      variant="muted"
      onPress={() => {
        router.push(detailHref);
      }}
    >
      <View style={styles.header}>
        <Text style={styles.code}>{item.publicCode}</Text>
        <View style={styles.badges}>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{HSE_APPROVAL_COPY.pendingBadge}</Text>
          </View>
          <StatusBadge
            label={getOccurrenceSeverityLabel(item.criticality)}
            severity={item.criticality}
          />
        </View>
      </View>

      <Text numberOfLines={2} style={styles.summary}>
        {item.areaName ? `${item.areaName} · ` : ""}
        {item.taskSummary || item.title}
      </Text>

      <Text style={styles.meta}>
        Enviado por {submittedBy} · {relativeTime}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  badges: {
    alignItems: "flex-end",
    gap: 4,
  },
  card: {
    borderColor: statusChip.warning.border,
  },
  code: {
    color: statusChip.warning.foreground,
    fontFamily: "monospace",
    fontSize: typography.helper.fontSize,
    fontWeight: "700",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  pendingBadge: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    color: statusChip.warning.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summary: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    lineHeight: 21,
  },
});
