import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type EvaluationConflictCardProps = {
  title: string;
  message: string;
  isRefreshing?: boolean;
  onRefresh: () => void;
};

export function EvaluationConflictCard({
  title,
  message,
  isRefreshing = false,
  onRefresh,
}: EvaluationConflictCardProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <Pressable
        accessibilityLabel="Atualizar ocorrência"
        accessibilityRole="button"
        accessibilityState={{ busy: isRefreshing }}
        disabled={isRefreshing}
        style={({ pressed }) => [
          styles.button,
          isRefreshing && styles.buttonDisabled,
          pressed && !isRefreshing && styles.pressed,
        ]}
        onPress={onRefresh}
      >
        {isRefreshing ? (
          <ActivityIndicator color="#F9FAFB" size="small" />
        ) : (
          <Text style={styles.buttonText}>Atualizar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    backgroundColor: "#1F2937",
    borderColor: "#92400E",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  message: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    color: "#FBBF24",
    fontSize: 15,
    fontWeight: "700",
  },
});
