import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, controlHeight, radius, spacing, typography } from "@safestop/ui";

type OccurrenceErrorProps = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function OccurrenceError({
  message = "Não foi possível carregar as ocorrências.",
  onRetry,
  retryLabel = "Tentar novamente",
}: OccurrenceErrorProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.message}>{message}</Text>
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
    alignItems: "center",
    flex: 1,
    gap: spacing[4],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  message: {
    color: colors.destructive,
    fontSize: typography.helper.fontSize,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    minWidth: 160,
    paddingHorizontal: spacing[5],
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
});
