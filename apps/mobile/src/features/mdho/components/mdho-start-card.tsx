import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type MdhoStartCardProps = {
  isOnline: boolean;
  isStarting: boolean;
  onStart: () => Promise<void>;
};

export function MdhoStartCard({ isOnline, isStarting, onStart }: MdhoStartCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        A Interdição Oficial está confirmada. Inicie a Avaliação Técnica (MDHO) para registrar a
        análise estruturada.
      </Text>

      {!isOnline ? (
        <Text style={styles.offline}>Conecte-se para continuar a Avaliação Técnica (MDHO).</Text>
      ) : null}

      <Pressable
        accessibilityLabel={
          isStarting ? "Iniciando Avaliação Técnica" : "Iniciar Avaliação Técnica (MDHO)"
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: !isOnline || isStarting, busy: isStarting }}
        disabled={!isOnline || isStarting}
        style={({ pressed }) => [
          styles.button,
          (!isOnline || isStarting) && styles.buttonDisabled,
          pressed && isOnline && !isStarting && styles.pressed,
        ]}
        onPress={() => {
          void onStart();
        }}
      >
        {isStarting ? (
          <ActivityIndicator color="#EFF6FF" size="small" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Avaliação Técnica (MDHO)</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#EFF6FF",
    fontSize: 15,
    fontWeight: "700",
  },
  container: {
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  intro: {
    color: "#DBEAFE",
    fontSize: 14,
    lineHeight: 20,
  },
  offline: {
    color: "#93C5FD",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
});
