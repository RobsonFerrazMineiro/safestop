import { Zap } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

export function PreventiveStopCallout() {
  return (
    <View style={styles.container}>
      <Zap accessible={false} color={statusChip.info.foreground} size={16} strokeWidth={2} />
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
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  text: {
    color: statusChip.info.foreground,
    flex: 1,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
});
