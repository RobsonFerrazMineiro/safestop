import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

export function ProfileNotFound() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Text style={styles.text}>
        Perfil não encontrado. Entre em contato com o administrador da plataforma.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  text: {
    color: statusChip.warning.foreground,
    fontSize: typography.helper.fontSize,
  },
});
