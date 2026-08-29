import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { authRoutes } from "@/lib/auth/routes";

export function AuthorizationForbidden() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acesso negado</Text>
      <Text style={styles.description}>
        Você não possui permissão para acessar esta área na organização ativa.
      </Text>
      <Button
        accessibilityLabel="Voltar ao início"
        variant="ghost"
        onPress={() => {
          router.replace(authRoutes.app);
        }}
      >
        Voltar ao início
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing[3],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  description: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    textAlign: "center",
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
});
