import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

export function OrganizationEmpty() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Text style={styles.title}>Nenhuma organização disponível</Text>
      <Text style={styles.text}>
        Você não possui vínculo ativo com nenhuma organização. Entre em contato com o administrador
        da plataforma.
      </Text>
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
  text: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    textAlign: "center",
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
});
