import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MDHO_RETURN_REASON_MAX_LENGTH, MDHO_RETURN_REASON_MIN_LENGTH } from "@safestop/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HSE_APPROVAL_COPY } from "../utils/hse-approval-copy";

type HseReturnDialogProps = {
  visible: boolean;
  isReturning: boolean;
  onClose: () => void;
  onConfirm: (returnReason: string) => void;
};

export function HseReturnDialog({
  visible,
  isReturning,
  onClose,
  onConfirm,
}: HseReturnDialogProps) {
  const insets = useSafeAreaInsets();
  const [returnReason, setReturnReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmedReason = returnReason.trim();

  function handleClose() {
    setReturnReason("");
    setError(null);
    onClose();
  }

  function handleConfirm() {
    if (trimmedReason.length < MDHO_RETURN_REASON_MIN_LENGTH) {
      setError(HSE_APPROVAL_COPY.returnReasonTooShort);
      return;
    }

    if (trimmedReason.length > MDHO_RETURN_REASON_MAX_LENGTH) {
      setError(HSE_APPROVAL_COPY.returnReasonTooLong);
      return;
    }

    onConfirm(trimmedReason);
    setReturnReason("");
    setError(null);
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.title}>{HSE_APPROVAL_COPY.returnDialogTitle}</Text>

          <Text style={styles.label}>{HSE_APPROVAL_COPY.returnReasonLabel}</Text>
          <Text style={styles.helper}>{HSE_APPROVAL_COPY.returnReasonHelper}</Text>

          <TextInput
            accessibilityLabel={HSE_APPROVAL_COPY.returnReasonLabel}
            editable={!isReturning}
            multiline
            placeholder="Descreva o motivo..."
            placeholderTextColor="#6B7280"
            style={styles.input}
            value={returnReason}
            onChangeText={(value) => {
              setReturnReason(value);
              setError(null);
            }}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={HSE_APPROVAL_COPY.cancel}
              accessibilityRole="button"
              disabled={isReturning}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={handleClose}
            >
              <Text style={styles.cancelText}>{HSE_APPROVAL_COPY.cancel}</Text>
            </Pressable>

            <Pressable
              accessibilityLabel={
                isReturning ? HSE_APPROVAL_COPY.returning : HSE_APPROVAL_COPY.returnDialogAction
              }
              accessibilityRole="button"
              disabled={isReturning}
              style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
              onPress={handleConfirm}
            >
              {isReturning ? (
                <ActivityIndicator color="#FEE2E2" size="small" />
              ) : (
                <Text style={styles.confirmText}>{HSE_APPROVAL_COPY.returnDialogAction}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  backdrop: {
    flex: 1,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  cancelText: {
    color: "#D1D5DB",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  confirmText: {
    color: "#FEE2E2",
    fontSize: 15,
    fontWeight: "700",
  },
  error: {
    color: "#F87171",
    fontSize: 13,
  },
  helper: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    maxHeight: 160,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  pressed: {
    opacity: 0.85,
  },
  sheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
  },
});
