import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { authRoutes } from "@/lib/auth/routes";

export function AuthorizationForbidden() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acesso negado</Text>
      <Text style={styles.description}>
        Você não possui permissão para acessar esta área na organização ativa.
      </Text>
      <Pressable onPress={() => router.replace(authRoutes.app)}>
        <Text style={styles.link}>Voltar ao início</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#0F1115",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  description: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  link: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
});
