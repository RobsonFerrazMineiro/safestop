import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { DashboardActionItemAttentionItem } from "@safestop/types";
import { isActionItemStatus } from "@safestop/types";

import { formatActionItemStatus, formatDueDate } from "@/features/action-plan/utils/format-labels";
import { stopWorkDetailRoute } from "@/lib/auth/routes";

type ActionAttentionItemCardProps = {
  item: DashboardActionItemAttentionItem;
};

function daysUntilDue(value: string): number {
  const diffMs = new Date(value).getTime() - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function ActionAttentionItemCard({ item }: ActionAttentionItemCardProps) {
  const router = useRouter();
  const days = daysUntilDue(item.dueAt);
  const statusLabel = isActionItemStatus(item.status)
    ? formatActionItemStatus(item.status)
    : item.status;

  return (
    <Pressable
      accessibilityHint="Abrir ocorrência"
      accessibilityLabel={`${item.title}, prazo ${formatDueDate(item.dueAt)}`}
      accessibilityRole="button"
      disabled={!item.occurrenceId}
      style={({ pressed }) => [styles.card, pressed && item.occurrenceId && styles.pressed]}
      onPress={() => {
        if (item.occurrenceId) {
          router.push(stopWorkDetailRoute(item.occurrenceId));
        }
      }}
    >
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Prazo: {formatDueDate(item.dueAt)}</Text>
        {days >= 0 && days <= 3 ? (
          <View style={styles.dueSoonChip}>
            <Text style={styles.dueSoonChipText}>
              Em {days} dia{days === 1 ? "" : "s"}
            </Text>
          </View>
        ) : null}
        <Text style={styles.meta}>{statusLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dueSoonChip: {
    backgroundColor: "#451A03",
    borderColor: "#D97706",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dueSoonChipText: {
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "600",
  },
  meta: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
});
