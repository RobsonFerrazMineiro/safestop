import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
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
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
        {!isOnline ? <Text style={styles.offline}>{HSE_APPROVAL_COPY.offlineToast}</Text> : null}

        <View style={styles.row}>
          {canReturn ? (
            <Button
              accessibilityLabel={HSE_APPROVAL_COPY.returnCta}
              disabled={isBusy}
              loading={isReturning}
              style={canApprove ? styles.halfButton : styles.fullButton}
              variant="destructive"
              onPress={handleReturnPress}
            >
              {HSE_APPROVAL_COPY.returnCta}
            </Button>
          ) : null}

          {canApprove ? (
            <Button
              accessibilityLabel={
                isApproving ? HSE_APPROVAL_COPY.approving : HSE_APPROVAL_COPY.approveCta
              }
              disabled={isBusy}
              loading={isApproving}
              style={canReturn ? styles.halfButton : styles.fullButton}
              onPress={() => {
                void confirmApprove();
              }}
            >
              {HSE_APPROVAL_COPY.approveCta}
            </Button>
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
  container: {
    backgroundColor: colors.background,
    borderTopColor: statusChip.warning.border,
    borderTopWidth: 1,
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  fullButton: {
    flex: 1,
  },
  halfButton: {
    flex: 1,
  },
  offline: {
    color: statusChip.warning.foreground,
    fontSize: typography.helper.fontSize,
  },
  row: {
    flexDirection: "row",
    gap: spacing[2],
  },
});
