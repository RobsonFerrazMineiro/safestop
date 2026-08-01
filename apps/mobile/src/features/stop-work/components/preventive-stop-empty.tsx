import { Pressable, StyleSheet, Text, View } from "react-native";

type PreventiveStopEmptyProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function PreventiveStopEmpty({
  title = "Nenhuma Paralisação Preventiva encontrada.",
  description = "As Paralisações Preventivas registradas na organização ativa aparecerão aqui.",
  actionLabel,
  onAction,
}: PreventiveStopEmptyProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
          onPress={onAction}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  container: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  description: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
