import { StyleSheet, Text, View } from "react-native";
import {
  canSubmitActionItem,
  canValidateActionItem,
  type ActionItemStatus,
  type ActionPlanGuardContext,
} from "@safestop/types";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button, Card, StatusBadge } from "@/components/ui";

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

  const actionDisabled = !isOnline || isBusy;

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title}</Text>
        <StatusBadge label={formatActionItemPriority(item.priority)} severity={item.priority} />
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
          <Button
            accessibilityLabel={ACTION_PLAN_COPY.start}
            disabled={actionDisabled}
            style={styles.actionButton}
            onPress={onStart}
          >
            {ACTION_PLAN_COPY.start}
          </Button>
        ) : null}

        {canSubmit && item.status === "IN_PROGRESS" ? (
          <Button
            accessibilityLabel={ACTION_PLAN_COPY.submit}
            disabled={actionDisabled}
            style={styles.actionButton}
            onPress={onSubmit}
          >
            {ACTION_PLAN_COPY.submit}
          </Button>
        ) : null}

        {canValidate ? (
          <Button
            accessibilityLabel={ACTION_PLAN_COPY.approve}
            disabled={actionDisabled}
            style={styles.actionButton}
            variant="secondary"
            onPress={onValidate}
          >
            {ACTION_PLAN_COPY.approve}
          </Button>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    minWidth: 96,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  due: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between",
  },
  meta: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  overdueChip: {
    alignSelf: "flex-start",
    backgroundColor: statusChip.destructive.background,
    borderColor: statusChip.destructive.border,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing[1],
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  overdueText: {
    color: statusChip.destructive.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
});
