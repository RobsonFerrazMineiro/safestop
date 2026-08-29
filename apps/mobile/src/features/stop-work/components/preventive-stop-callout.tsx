import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

export function PreventiveStopCallout() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>Preenchimento otimizado para menos de 60 segundos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  icon: {
    fontSize: typography.body.fontSize,
  },
  text: {
    color: statusChip.info.foreground,
    flex: 1,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
});
