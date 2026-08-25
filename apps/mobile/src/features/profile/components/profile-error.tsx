import { Pressable, StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "rgba(127, 29, 29, 0.4)",
    borderColor: "rgba(127, 29, 29, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  text: {
    color: "#FECACA",
    fontSize: 14,
  },
});
