import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { validateActionItemSchema } from "@safestop/validation";

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
                style={[styles.approveButton, (!isOnline || isValidating) && styles.disabled]}
                onPress={() => {
                  void onApprove().then(resetAndClose);
                }}
              >
                {isValidating ? (
                  <ActivityIndicator color="#DCFCE7" />
                ) : (
                  <Text style={styles.approveText}>{ACTION_PLAN_COPY.approve}</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!isOnline || isValidating}
                style={[styles.rejectButton, (!isOnline || isValidating) && styles.disabled]}
                onPress={() => {
                  setMode("reject");
                }}
              >
                <Text style={styles.rejectText}>{ACTION_PLAN_COPY.reject}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={styles.cancelButton}
                onPress={resetAndClose}
              >
                <Text style={styles.cancelText}>{ACTION_PLAN_COPY.cancel}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={styles.title}>{ACTION_PLAN_COPY.rejectTitle}</Text>
              <Text style={styles.label}>{ACTION_PLAN_COPY.rejectNoteLabel}</Text>
              <TextInput
                editable={isOnline && !isValidating}
                multiline
                placeholder="Descreva o motivo"
                placeholderTextColor="#6B7280"
                style={styles.textarea}
                value={note}
                onChangeText={setNote}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                accessibilityRole="button"
                disabled={!isOnline || isValidating}
                style={[styles.rejectButton, (!isOnline || isValidating) && styles.disabled]}
                onPress={() => {
                  void handleReject();
                }}
              >
                <Text style={styles.rejectText}>{ACTION_PLAN_COPY.reject}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.cancelButton}
                onPress={() => {
                  setMode("choose");
                  setError(null);
                }}
              >
                <Text style={styles.cancelText}>{ACTION_PLAN_COPY.cancel}</Text>
              </Pressable>
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
    backgroundColor: "#14532D",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 48,
  },
  approveText: {
    color: "#DCFCE7",
    fontSize: 16,
    fontWeight: "700",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  cancelButton: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  cancelText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  disabled: {
    opacity: 0.45,
  },
  error: {
    color: "#FCA5A5",
    fontSize: 13,
  },
  label: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rejectButton: {
    alignItems: "center",
    backgroundColor: "#450A0A",
    borderRadius: 10,
    borderColor: "#EF4444",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  rejectText: {
    color: "#FCA5A5",
    fontSize: 16,
    fontWeight: "700",
  },
  sheet: {
    backgroundColor: "#0B1220",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  textarea: {
    backgroundColor: "#111827",
    borderColor: "#374151",
    borderRadius: 10,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    minHeight: 96,
    padding: 12,
    textAlignVertical: "top",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
  },
});
