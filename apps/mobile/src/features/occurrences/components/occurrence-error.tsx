import { Pressable, StyleSheet, Text, View } from "react-native";

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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  message: {
    color: "#F87171",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 44,
    minWidth: 160,
    paddingHorizontal: 20,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "600",
  },
});
