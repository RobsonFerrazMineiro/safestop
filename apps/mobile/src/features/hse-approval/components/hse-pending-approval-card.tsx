import type { MdhoPendingApprovalItem } from "@safestop/types";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
    <Pressable
      accessibilityLabel={`Ocorrência ${item.publicCode}, enviada por ${submittedBy}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => {
        router.push(detailHref);
      }}
    >
      <View style={styles.header}>
        <Text style={styles.code}>{item.publicCode}</Text>
        <View style={styles.badges}>
          <Text style={styles.pendingBadge}>{HSE_APPROVAL_COPY.pendingBadge}</Text>
          <Text style={styles.severity}>{getOccurrenceSeverityLabel(item.criticality)}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.summary}>
        {item.areaName ? `${item.areaName} · ` : ""}
        {item.taskSummary || item.title}
      </Text>

      <Text style={styles.meta}>
        Enviado por {submittedBy} · {relativeTime}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badges: {
    alignItems: "flex-end",
    gap: 4,
  },
  card: {
    backgroundColor: "#1F2937",
    borderColor: "#D97706",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  code: {
    color: "#FBBF24",
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "700",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  pendingBadge: {
    backgroundColor: "#78350F",
    borderRadius: 999,
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: "uppercase",
  },
  severity: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "600",
  },
  summary: {
    color: "#F9FAFB",
    fontSize: 15,
    lineHeight: 21,
  },
});
