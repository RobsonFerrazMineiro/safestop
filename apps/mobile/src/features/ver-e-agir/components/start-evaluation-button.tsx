import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { confirmAction } from "@/lib/confirm-action";

type StartEvaluationButtonProps = {
  isStarting: boolean;
  onStart: () => Promise<void>;
};

export function StartEvaluationButton({ isStarting, onStart }: StartEvaluationButtonProps) {
  async function confirmStart() {
    const confirmed = await confirmAction({
      title: "Iniciar avaliação desta paralisação?",
      message: "A ocorrência passará para Em Avaliação para registro da decisão da liderança.",
      confirmLabel: "Iniciar avaliação",
    });

    if (confirmed) {
      await onStart();
    }
  }

  return (
    <Pressable
      accessibilityLabel={isStarting ? "Iniciando avaliação" : "Iniciar avaliação"}
      accessibilityRole="button"
      accessibilityState={{ disabled: isStarting, busy: isStarting }}
      disabled={isStarting}
      style={({ pressed }) => [
        styles.button,
        isStarting && styles.buttonDisabled,
        pressed && !isStarting && styles.pressed,
      ]}
      onPress={() => {
        void confirmStart();
      }}
    >
      {isStarting ? (
        <ActivityIndicator color="#0F1115" size="small" />
      ) : (
        <Text style={styles.buttonText}>Iniciar avaliação</Text>
      )}
    </Pressable>
  );
}

export function EvaluationWaitingBanner() {
  return (
    <View accessibilityRole="text" style={styles.banner}>
      <Text style={styles.bannerIcon}>ℹ</Text>
      <Text style={styles.bannerText}>Aguardando avaliação da liderança</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerIcon: {
    color: "#93C5FD",
    fontSize: 16,
    fontWeight: "700",
  },
  bannerText: {
    color: "#DBEAFE",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#0F1115",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
