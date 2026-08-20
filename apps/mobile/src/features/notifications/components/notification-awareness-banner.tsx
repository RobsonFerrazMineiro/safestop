import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
      <Pressable
        accessibilityLabel={NOTIFICATION_COPY.confirmAwarenessCta}
        accessibilityRole="button"
        disabled={!isOnline || isConfirming}
        style={({ pressed }) => [
          styles.button,
          (!isOnline || isConfirming) && styles.buttonDisabled,
          pressed && isOnline && !isConfirming && styles.pressed,
        ]}
        onPress={() => {
          void handleConfirm();
        }}
      >
        {isConfirming ? (
          <ActivityIndicator color="#FFFBEB" size="small" />
        ) : (
          <Text style={styles.buttonText}>{NOTIFICATION_COPY.confirmAwarenessCta}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#D97706",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFBEB",
    fontSize: 14,
    fontWeight: "700",
  },
  container: {
    backgroundColor: "#78350F",
    borderColor: "#D97706",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  message: {
    color: "#FDE68A",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
