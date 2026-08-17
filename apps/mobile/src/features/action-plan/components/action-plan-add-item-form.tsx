import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ActionItemPriority } from "@safestop/types";
import { ACTION_ITEM_PRIORITIES } from "@safestop/types";

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
      <TextInput
        editable={isOnline && !isSubmitting}
        placeholder={ACTION_PLAN_COPY.titlePlaceholder}
        placeholderTextColor="#6B7280"
        style={styles.input}
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={!isOnline || isSubmitting}
          style={[styles.primaryButton, (!isOnline || isSubmitting) && styles.disabled]}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>{ACTION_PLAN_COPY.addAction}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>{ACTION_PLAN_COPY.cancel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
  chip: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipSelected: {
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
  },
  chipText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#DBEAFE",
  },
  container: {
    backgroundColor: "#0B1220",
    borderColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  error: {
    color: "#FCA5A5",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#111827",
    borderColor: "#374151",
    borderRadius: 10,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  label: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButtonText: {
    color: "#EFF6FF",
    fontSize: 15,
    fontWeight: "700",
  },
});
