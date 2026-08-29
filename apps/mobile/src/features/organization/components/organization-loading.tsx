import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

export function OrganizationLoading() {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>Carregando organizações...</Text>
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
  },
  text: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
  },
});
