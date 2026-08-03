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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IMS_REFERENCE_COPY } from "../utils/ims-reference-copy";

type ImsEditDialogProps = {
  visible: boolean;
  currentCode: string;
  isUpdating: boolean;
  isOnline: boolean;
  onClose: () => void;
  onConfirm: (newCode: string, updateReason: string) => void;
};

export function ImsEditDialog({
  visible,
  currentCode,
  isUpdating,
  isOnline,
  onClose,
  onConfirm,
}: ImsEditDialogProps) {
  const insets = useSafeAreaInsets();
  const [newCode, setNewCode] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  function handleClose() {
    setNewCode("");
    setUpdateReason("");
    setCodeError(null);
    setReasonError(null);
    onClose();
  }

  function handleConfirm() {
    if (!isOnline) {
      return;
    }

    const trimmedCode = newCode.trim();
    const trimmedReason = updateReason.trim();

    if (trimmedCode === currentCode) {
      setCodeError("Informe um código diferente do atual.");
      return;
    }

    if (!/^BAA-\d{2}-\d{4,}$/.test(trimmedCode)) {
      setCodeError(IMS_REFERENCE_COPY.formatError);
      return;
    }

    if (trimmedReason.length < 10) {
      setReasonError(IMS_REFERENCE_COPY.reasonTooShort);
      return;
    }

    if (trimmedReason.length > 4000) {
      setReasonError(IMS_REFERENCE_COPY.reasonTooLong);
      return;
    }

    onConfirm(trimmedCode, trimmedReason);
    setNewCode("");
    setUpdateReason("");
    setCodeError(null);
    setReasonError(null);
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.title}>{IMS_REFERENCE_COPY.editTitle}</Text>

          <Text style={styles.currentLabel}>{IMS_REFERENCE_COPY.currentCodeLabel}</Text>
          <Text style={styles.currentCode}>{currentCode}</Text>

          <Text style={styles.label}>{IMS_REFERENCE_COPY.newCodeLabel}</Text>
          <TextInput
            accessibilityLabel={IMS_REFERENCE_COPY.newCodeLabel}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={isOnline && !isUpdating}
            placeholder={IMS_REFERENCE_COPY.placeholder}
            placeholderTextColor="#6B7280"
            style={[styles.input, codeError ? styles.inputError : null]}
            value={newCode}
            onChangeText={(value) => {
              setNewCode(value);
              setCodeError(null);
            }}
          />
          {codeError ? <Text style={styles.error}>{codeError}</Text> : null}

          <Text style={styles.label}>{IMS_REFERENCE_COPY.reasonLabel}</Text>
          <Text style={styles.helper}>{IMS_REFERENCE_COPY.reasonHelper}</Text>
          <TextInput
            accessibilityLabel={IMS_REFERENCE_COPY.reasonLabel}
            editable={isOnline && !isUpdating}
            multiline
            placeholder="Descreva o motivo..."
            placeholderTextColor="#6B7280"
            style={[styles.textarea, reasonError ? styles.inputError : null]}
            value={updateReason}
            onChangeText={(value) => {
              setUpdateReason(value);
              setReasonError(null);
            }}
          />
          {reasonError ? <Text style={styles.error}>{reasonError}</Text> : null}

          {!isOnline ? <Text style={styles.offline}>{IMS_REFERENCE_COPY.offlineToast}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={IMS_REFERENCE_COPY.cancel}
              accessibilityRole="button"
              disabled={isUpdating}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={handleClose}
            >
              <Text style={styles.cancelText}>{IMS_REFERENCE_COPY.cancel}</Text>
            </Pressable>

            <Pressable
              accessibilityLabel={
                isUpdating ? IMS_REFERENCE_COPY.saving : IMS_REFERENCE_COPY.saveEditCta
              }
              accessibilityRole="button"
              disabled={!isOnline || isUpdating}
              style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
              onPress={handleConfirm}
            >
              {isUpdating ? (
                <ActivityIndicator color="#EFF6FF" size="small" />
              ) : (
                <Text style={styles.confirmText}>{IMS_REFERENCE_COPY.saveEditCta}</Text>
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
    backgroundColor: "#2563EB",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  confirmText: {
    color: "#EFF6FF",
    fontSize: 15,
    fontWeight: "700",
  },
  currentCode: {
    color: "#F9FAFB",
    fontFamily: "monospace",
    fontSize: 16,
    marginBottom: 8,
  },
  currentLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
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
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontFamily: "monospace",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#F87171",
  },
  label: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  offline: {
    color: "#93C5FD",
    fontSize: 13,
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
  textarea: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    maxHeight: 120,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
  },
});
