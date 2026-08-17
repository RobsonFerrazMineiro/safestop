import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  canSubmitActionItem,
  canValidateActionItem,
  type ActionItemPriority,
  type ActionItemStatus,
  type ActionPlanGuardContext,
} from "@safestop/types";

import type { ActionItemEnriched } from "../types";
import { ACTION_PLAN_COPY } from "../utils/action-plan-copy";
import {
  formatActionItemPriority,
  formatActionItemStatus,
  formatDueDate,
  isActionItemOverdue,
} from "../utils/format-labels";

type ActionPlanItemCardProps = {
  item: ActionItemEnriched;
  guardContext: ActionPlanGuardContext;
  currentUserId: string;
  isOnline: boolean;
  isBusy?: boolean;
  onStart: () => void;
  onSubmit: () => void;
  onValidate: () => void;
};

function priorityColor(priority: ActionItemPriority): string {
  switch (priority) {
    case "CRITICAL":
      return "#FCA5A5";
    case "HIGH":
      return "#FDBA74";
    case "MEDIUM":
      return "#93C5FD";
    default:
      return "#A7F3D0";
  }
}

export function ActionPlanItemCard({
  item,
  guardContext,
  currentUserId,
  isOnline,
  isBusy = false,
  onStart,
  onSubmit,
  onValidate,
}: ActionPlanItemCardProps) {
  const overdue = isActionItemOverdue(item.dueAt, item.status);
  const canStart =
    item.status === "PENDING" && canSubmitActionItem({ item, context: guardContext });
  const canSubmit =
    (item.status === "PENDING" || item.status === "IN_PROGRESS") &&
    canSubmitActionItem({ item, context: guardContext });
  const canValidate = canValidateActionItem({
    item,
    currentUserId,
    context: guardContext,
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={[styles.priorityBadge, { borderColor: priorityColor(item.priority) }]}>
          <Text style={[styles.priorityText, { color: priorityColor(item.priority) }]}>
            {formatActionItemPriority(item.priority)}
          </Text>
        </View>
      </View>

      <Text style={styles.meta}>
        {formatActionItemStatus(item.status as ActionItemStatus)}
        {item.responsibleMemberName ? ` · ${item.responsibleMemberName}` : ""}
      </Text>

      <Text style={styles.due}>
        {ACTION_PLAN_COPY.dueLabel}: {formatDueDate(item.dueAt)}
        {overdue ? ` · ${ACTION_PLAN_COPY.overdue}` : ""}
      </Text>

      {overdue ? (
        <View style={styles.overdueChip}>
          <Text style={styles.overdueText}>{ACTION_PLAN_COPY.overdue}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {canStart ? (
          <Pressable
            accessibilityLabel={ACTION_PLAN_COPY.start}
            accessibilityRole="button"
            disabled={!isOnline || isBusy}
            style={({ pressed }) => [
              styles.primaryButton,
              (!isOnline || isBusy) && styles.disabled,
              pressed && isOnline && !isBusy && styles.pressed,
            ]}
            onPress={onStart}
          >
            <Text style={styles.primaryButtonText}>{ACTION_PLAN_COPY.start}</Text>
          </Pressable>
        ) : null}

        {canSubmit && item.status === "IN_PROGRESS" ? (
          <Pressable
            accessibilityLabel={ACTION_PLAN_COPY.submit}
            accessibilityRole="button"
            disabled={!isOnline || isBusy}
            style={({ pressed }) => [
              styles.primaryButton,
              (!isOnline || isBusy) && styles.disabled,
              pressed && isOnline && !isBusy && styles.pressed,
            ]}
            onPress={onSubmit}
          >
            <Text style={styles.primaryButtonText}>{ACTION_PLAN_COPY.submit}</Text>
          </Pressable>
        ) : null}

        {canValidate ? (
          <Pressable
            accessibilityLabel={ACTION_PLAN_COPY.approve}
            accessibilityRole="button"
            disabled={!isOnline || isBusy}
            style={({ pressed }) => [
              styles.validateButton,
              (!isOnline || isBusy) && styles.disabled,
              pressed && isOnline && !isBusy && styles.pressed,
            ]}
            onPress={onValidate}
          >
            <Text style={styles.validateButtonText}>{ACTION_PLAN_COPY.approve}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: "#111827",
    borderColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  due: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  meta: {
    color: "#D1D5DB",
    fontSize: 13,
  },
  overdueChip: {
    alignSelf: "flex-start",
    backgroundColor: "#450A0A",
    borderColor: "#EF4444",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  overdueText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#EFF6FF",
    fontSize: 15,
    fontWeight: "700",
  },
  priorityBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#DBEAFE",
    fontSize: 15,
    fontWeight: "700",
  },
  title: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  validateButton: {
    alignItems: "center",
    backgroundColor: "#14532D",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 16,
  },
  validateButtonText: {
    color: "#DCFCE7",
    fontSize: 15,
    fontWeight: "700",
  },
});
