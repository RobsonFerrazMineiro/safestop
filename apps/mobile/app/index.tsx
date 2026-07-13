import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Tela mínima de verificação da Sprint 1.3.
 *
 * Confirma que o Expo Router está inicializado e integrado ao monorepo.
 * Não implementa login, dashboard ou regras de negócio — isso pertence
 * às próximas Sprints (docs/roadmap.md).
 */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SafeStop</Text>
        <Text style={styles.subtitle}>Aplicativo Mobile inicializado.</Text>
        <Text style={styles.description}>
          A comunicação de Paralisações Preventivas será implementada nas próximas etapas.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F97316",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
