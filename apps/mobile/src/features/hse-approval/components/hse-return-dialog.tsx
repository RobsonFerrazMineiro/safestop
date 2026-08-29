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
import { MDHO_RETURN_REASON_MAX_LENGTH, MDHO_RETURN_REASON_MIN_LENGTH } from "@safestop/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, overlay, radius, spacing, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";

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

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
          <Text style={styles.title}>{HSE_APPROVAL_COPY.returnDialogTitle}</Text>

          <TextField
            accessibilityLabel={HSE_APPROVAL_COPY.returnReasonLabel}
            disabled={isReturning}
            error={error ?? undefined}
            helperText={HSE_APPROVAL_COPY.returnReasonHelper}
            inputStyle={styles.multilineInput}
            label={HSE_APPROVAL_COPY.returnReasonLabel}
            multiline
            placeholder="Descreva o motivo..."
            value={returnReason}
            onChangeText={(value) => {
              setReturnReason(value);
              setError(null);
            }}
          />

          <View style={styles.actions}>
            <Button
              accessibilityLabel={HSE_APPROVAL_COPY.cancel}
              disabled={isReturning}
              style={styles.actionButton}
              variant="secondary"
              onPress={handleClose}
            >
              {HSE_APPROVAL_COPY.cancel}
            </Button>

            <Button
              accessibilityLabel={
                isReturning ? HSE_APPROVAL_COPY.returning : HSE_APPROVAL_COPY.returnDialogAction
              }
              disabled={isReturning}
              loading={isReturning}
              style={styles.actionButton}
              variant="destructive"
              onPress={handleConfirm}
            >
              {HSE_APPROVAL_COPY.returnDialogAction}
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
  multilineInput: {
    maxHeight: 160,
    minHeight: 100,
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
    fontWeight: typography.cardTitle.fontWeight,
  },
});
