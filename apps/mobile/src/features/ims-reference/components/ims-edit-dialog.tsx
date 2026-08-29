import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, overlay, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";

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

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
          <Text style={styles.title}>{IMS_REFERENCE_COPY.editTitle}</Text>

          <Text style={styles.currentLabel}>{IMS_REFERENCE_COPY.currentCodeLabel}</Text>
          <Text style={styles.currentCode}>{currentCode}</Text>

          <TextField
            autoCapitalize="characters"
            autoCorrect={false}
            disabled={isUpdating}
            error={codeError ?? undefined}
            inputStyle={styles.monospaceInput}
            label={IMS_REFERENCE_COPY.newCodeLabel}
            placeholder={IMS_REFERENCE_COPY.placeholder}
            value={newCode}
            onChangeText={(value) => {
              setNewCode(value);
              setCodeError(null);
            }}
          />

          <TextField
            disabled={isUpdating}
            error={reasonError ?? undefined}
            helperText={IMS_REFERENCE_COPY.reasonHelper}
            label={IMS_REFERENCE_COPY.reasonLabel}
            multiline
            placeholder="Descreva o motivo..."
            value={updateReason}
            onChangeText={(value) => {
              setUpdateReason(value);
              setReasonError(null);
            }}
          />

          {!isOnline ? <Text style={styles.offline}>{IMS_REFERENCE_COPY.offlineToast}</Text> : null}

          <View style={styles.actions}>
            <Button
              accessibilityLabel={IMS_REFERENCE_COPY.cancel}
              disabled={isUpdating}
              style={styles.actionButton}
              variant="secondary"
              onPress={handleClose}
            >
              {IMS_REFERENCE_COPY.cancel}
            </Button>

            <Button
              accessibilityLabel={
                isUpdating ? IMS_REFERENCE_COPY.saving : IMS_REFERENCE_COPY.saveEditCta
              }
              disabled={isUpdating || !isOnline}
              loading={isUpdating}
              style={styles.actionButton}
              onPress={handleConfirm}
            >
              {IMS_REFERENCE_COPY.saveEditCta}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  backdrop: {
    flex: 1,
  },
  currentCode: {
    color: colors.foreground,
    fontFamily: "monospace",
    fontSize: typography.cardTitle.fontSize,
    marginBottom: spacing[2],
  },
  currentLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  monospaceInput: {
    fontFamily: "monospace",
    fontSize: typography.cardTitle.fontSize,
  },
  offline: {
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
  },
  overlay: {
    backgroundColor: overlay.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "700",
  },
});
