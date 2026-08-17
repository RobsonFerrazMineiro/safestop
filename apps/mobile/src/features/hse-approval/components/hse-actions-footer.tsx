import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { confirmAction } from "@/lib/confirm-action";

import type { HseActionsFooterState } from "../types";
import { HSE_APPROVAL_COPY } from "../utils/hse-approval-copy";
import { HseReturnDialog } from "./hse-return-dialog";

type HseActionsFooterProps = HseActionsFooterState;

export function HseActionsFooter({
  canApprove,
  canReturn,
  isOnline,
  isApproving,
  isReturning,
  onApprove,
  onReturn,
}: HseActionsFooterProps) {
  const insets = useSafeAreaInsets();
  const [returnDialogVisible, setReturnDialogVisible] = useState(false);

  const isBusy = isApproving || isReturning;

  async function confirmApprove() {
    if (!isOnline) {
      return;
    }

    const confirmed = await confirmAction({
      title: HSE_APPROVAL_COPY.approveDialogTitle,
      message: HSE_APPROVAL_COPY.approveDialogBody,
      confirmLabel: HSE_APPROVAL_COPY.approveDialogAction,
    });

    if (confirmed) {
      onApprove();
    }
  }

  function handleReturnPress() {
    if (!isOnline) {
      return;
    }

    setReturnDialogVisible(true);
  }

  function handleReturnConfirm(returnReason: string) {
    void onReturn(returnReason).finally(() => {
      setReturnDialogVisible(false);
    });
  }

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {!isOnline ? <Text style={styles.offline}>{HSE_APPROVAL_COPY.offlineToast}</Text> : null}

        <View style={styles.row}>
          {canReturn ? (
            <Pressable
              accessibilityLabel={HSE_APPROVAL_COPY.returnCta}
              accessibilityRole="button"
              disabled={isBusy}
              style={({ pressed }) => [
                styles.returnButton,
                canApprove ? styles.halfButton : styles.fullButton,
                isBusy && styles.buttonDisabled,
                pressed && !isBusy && styles.pressed,
              ]}
              onPress={handleReturnPress}
            >
              {isReturning ? (
                <ActivityIndicator color="#FCA5A5" size="small" />
              ) : (
                <Text style={styles.returnText}>{HSE_APPROVAL_COPY.returnCta}</Text>
              )}
            </Pressable>
          ) : null}

          {canApprove ? (
            <Pressable
              accessibilityLabel={
                isApproving ? HSE_APPROVAL_COPY.approving : HSE_APPROVAL_COPY.approveCta
              }
              accessibilityRole="button"
              disabled={isBusy}
              style={({ pressed }) => [
                styles.approveButton,
                canReturn ? styles.halfButton : styles.fullButton,
                isBusy && styles.buttonDisabled,
                pressed && !isBusy && styles.pressed,
              ]}
              onPress={() => {
                void confirmApprove();
              }}
            >
              {isApproving ? (
                <ActivityIndicator color="#FFFBEB" size="small" />
              ) : (
                <Text style={styles.approveText}>{HSE_APPROVAL_COPY.approveCta}</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      <HseReturnDialog
        isReturning={isReturning}
        visible={returnDialogVisible}
        onClose={() => {
          setReturnDialogVisible(false);
        }}
        onConfirm={handleReturnConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  approveButton: {
    alignItems: "center",
    backgroundColor: "#D97706",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  approveText: {
    color: "#FFFBEB",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  container: {
    backgroundColor: "#0F1115",
    borderTopColor: "#92400E",
    borderTopWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  fullButton: {
    flex: 1,
  },
  halfButton: {
    flex: 1,
  },
  offline: {
    color: "#FCD34D",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  returnButton: {
    alignItems: "center",
    borderColor: "#DC2626",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  returnText: {
    color: "#FCA5A5",
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
});
