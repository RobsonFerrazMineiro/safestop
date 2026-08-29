import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { validateActionItemSchema } from "@safestop/validation";
import { colors, overlay, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";

import { ACTION_PLAN_COPY } from "../utils/action-plan-copy";

type ActionPlanValidateSheetProps = {
  visible: boolean;
  itemId: string;
  isOnline: boolean;
  isValidating: boolean;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: (note: string) => Promise<void>;
};

export function ActionPlanValidateSheet({
  visible,
  itemId,
  isOnline,
  isValidating,
  onClose,
  onApprove,
  onReject,
}: ActionPlanValidateSheetProps) {
  const [mode, setMode] = useState<"choose" | "reject">("choose");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resetAndClose() {
    setMode("choose");
    setNote("");
    setError(null);
    onClose();
  }

  async function handleReject() {
    const parsed = validateActionItemSchema.safeParse({
      itemId,
      outcome: "REJECTED",
      note,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? ACTION_PLAN_COPY.rejectTitle);
      return;
    }

    setError(null);
    await onReject(parsed.data.note ?? "");
    resetAndClose();
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={resetAndClose}>
      <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={resetAndClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          {mode === "choose" ? (
            <View style={styles.content}>
              <Text style={styles.title}>Validar ação</Text>

              <Pressable
                accessibilityRole="button"
                disabled={!isOnline || isValidating}
                style={({ pressed }) => [
                  styles.approveButton,
                  (!isOnline || isValidating) && styles.disabled,
                  pressed && isOnline && !isValidating && styles.pressed,
                ]}
                onPress={() => {
                  void onApprove().then(resetAndClose);
                }}
              >
                {isValidating ? (
                  <ActivityIndicator color={statusChip.success.foreground} />
                ) : (
                  <Text style={styles.approveText}>{ACTION_PLAN_COPY.approve}</Text>
                )}
              </Pressable>

              <Button
                accessibilityRole="button"
                disabled={!isOnline || isValidating}
                variant="destructive"
                onPress={() => {
                  setMode("reject");
                }}
              >
                {ACTION_PLAN_COPY.reject}
              </Button>

              <Button accessibilityRole="button" variant="ghost" onPress={resetAndClose}>
                {ACTION_PLAN_COPY.cancel}
              </Button>
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={styles.title}>{ACTION_PLAN_COPY.rejectTitle}</Text>
              <TextField
                disabled={!isOnline || isValidating}
                error={error ?? undefined}
                label={ACTION_PLAN_COPY.rejectNoteLabel}
                multiline
                placeholder="Descreva o motivo"
                value={note}
                onChangeText={setNote}
              />
              <Button
                accessibilityRole="button"
                disabled={!isOnline || isValidating}
                loading={isValidating}
                variant="destructive"
                onPress={() => {
                  void handleReject();
                }}
              >
                {ACTION_PLAN_COPY.reject}
              </Button>
              <Button
                accessibilityRole="button"
                variant="ghost"
                onPress={() => {
                  setMode("choose");
                  setError(null);
                }}
              >
                {ACTION_PLAN_COPY.cancel}
              </Button>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  approveButton: {
    alignItems: "center",
    backgroundColor: statusChip.success.background,
    borderColor: statusChip.success.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  approveText: {
    color: statusChip.success.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
  backdrop: {
    backgroundColor: overlay.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    gap: spacing[3],
    paddingBottom: spacing[6],
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "700",
  },
});
