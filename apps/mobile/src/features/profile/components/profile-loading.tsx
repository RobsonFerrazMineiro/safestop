import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

export function ProfileLoading() {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>Carregando perfil...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[3],
    justifyContent: "center",
    paddingVertical: spacing[8],
  },
  text: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
  },
});
