import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

type ProfileErrorProps = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ProfileError({
  message,
  onRetry,
  retryLabel = "Tentar novamente",
}: ProfileErrorProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.text}>
        {message ?? "Não foi possível carregar o perfil. Tente novamente mais tarde."}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityLabel={retryLabel}
          accessibilityRole="button"
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: statusChip.destructive.background,
    borderColor: statusChip.destructive.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[4],
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  text: {
    color: statusChip.destructive.foreground,
    fontSize: typography.helper.fontSize,
  },
});
