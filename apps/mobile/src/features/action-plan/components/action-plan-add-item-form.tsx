import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ActionItemPriority } from "@safestop/types";
import { ACTION_ITEM_PRIORITIES } from "@safestop/types";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";

import type { OrganizationMemberOption } from "../types";
import { ACTION_PLAN_COPY } from "../utils/action-plan-copy";
import { dueInDays, formatActionItemPriority } from "../utils/format-labels";

type ActionPlanAddItemFormProps = {
  members: OrganizationMemberOption[];
  isOnline: boolean;
  isSubmitting: boolean;
  onSubmit: (input: {
    title: string;
    responsibleMemberId: string;
    dueAt: string;
    priority: ActionItemPriority;
  }) => void;
  onCancel: () => void;
};

const DUE_PRESETS = [
  { label: "3 dias", days: 3 },
  { label: "7 dias", days: 7 },
  { label: "14 dias", days: 14 },
];

export function ActionPlanAddItemForm({
  members,
  isOnline,
  isSubmitting,
  onSubmit,
  onCancel,
}: ActionPlanAddItemFormProps) {
  const [title, setTitle] = useState("");
  const [responsibleMemberId, setResponsibleMemberId] = useState(members[0]?.id ?? "");
  const [dueDays, setDueDays] = useState(7);
  const [priority, setPriority] = useState<ActionItemPriority>("MEDIUM");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!title.trim()) {
      setError("Informe o título da ação.");
      return;
    }

    if (!responsibleMemberId) {
      setError("Selecione o responsável.");
      return;
    }

    setError(null);
    onSubmit({
      title: title.trim(),
      responsibleMemberId,
      dueAt: dueInDays(dueDays),
      priority,
    });
  }

  return (
    <View style={styles.container}>
      <TextField
        disabled={!isOnline || isSubmitting}
        error={error ?? undefined}
        placeholder={ACTION_PLAN_COPY.titlePlaceholder}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>{ACTION_PLAN_COPY.responsibleLabel}</Text>
      <View style={styles.chipRow}>
        {members.map((member) => (
          <Pressable
            key={member.id}
            disabled={!isOnline || isSubmitting}
            style={[styles.chip, responsibleMemberId === member.id && styles.chipSelected]}
            onPress={() => {
              setResponsibleMemberId(member.id);
            }}
          >
            <Text
              style={[
                styles.chipText,
                responsibleMemberId === member.id && styles.chipTextSelected,
              ]}
            >
              {member.fullName ?? member.id.slice(0, 8)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{ACTION_PLAN_COPY.dueLabel}</Text>
      <View style={styles.chipRow}>
        {DUE_PRESETS.map((preset) => (
          <Pressable
            key={preset.days}
            disabled={!isOnline || isSubmitting}
            style={[styles.chip, dueDays === preset.days && styles.chipSelected]}
            onPress={() => {
              setDueDays(preset.days);
            }}
          >
            <Text style={[styles.chipText, dueDays === preset.days && styles.chipTextSelected]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{ACTION_PLAN_COPY.priorityLabel}</Text>
      <View style={styles.chipRow}>
        {ACTION_ITEM_PRIORITIES.map((value) => (
          <Pressable
            key={value}
            disabled={!isOnline || isSubmitting}
            style={[styles.chip, priority === value && styles.chipSelected]}
            onPress={() => {
              setPriority(value);
            }}
          >
            <Text style={[styles.chipText, priority === value && styles.chipTextSelected]}>
              {formatActionItemPriority(value)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          accessibilityRole="button"
          disabled={!isOnline || isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          {ACTION_PLAN_COPY.addAction}
        </Button>
        <Button accessibilityRole="button" variant="ghost" onPress={onCancel}>
          {ACTION_PLAN_COPY.cancel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[2],
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chipSelected: {
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
  },
  chipText: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: statusChip.info.foreground,
  },
  container: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing[2],
    padding: 14,
  },
  label: {
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  submitButton: {
    flex: 1,
  },
});
