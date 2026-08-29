import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { confirmAction } from "@/lib/confirm-action";

import { useConfirmNotificationAwareness } from "../hooks";
import { NOTIFICATION_COPY } from "../utils/notification-copy";

type NotificationAwarenessBannerProps = {
  notificationId: string;
  isOnline: boolean;
  onConfirmed?: () => void;
};

export function NotificationAwarenessBanner({
  notificationId,
  isOnline,
  onConfirmed,
}: NotificationAwarenessBannerProps) {
  const { confirmAwareness, isConfirming } = useConfirmNotificationAwareness();

  async function handleConfirm() {
    if (!isOnline) {
      return;
    }

    const confirmed = await confirmAction({
      title: NOTIFICATION_COPY.confirmAwarenessCta,
      message: NOTIFICATION_COPY.confirmAwarenessDialog,
      confirmLabel: NOTIFICATION_COPY.confirmAwarenessCta,
    });

    if (!confirmed) {
      return;
    }

    await confirmAwareness(notificationId);
    onConfirmed?.();
  }

  return (
    <View accessibilityRole="text" style={styles.container}>
      <Text style={styles.message}>{NOTIFICATION_COPY.awarenessBanner}</Text>
      <Button
        accessibilityLabel={NOTIFICATION_COPY.confirmAwarenessCta}
        disabled={!isOnline}
        loading={isConfirming}
        onPress={() => {
          void handleConfirm();
        }}
      >
        {NOTIFICATION_COPY.confirmAwarenessCta}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[3],
  },
  message: {
    color: statusChip.warning.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    lineHeight: 20,
  },
});
