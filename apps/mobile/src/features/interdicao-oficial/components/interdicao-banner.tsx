import { TriangleAlert } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

export function InterdicaoBanner() {
  return (
    <View accessibilityRole="text" style={styles.banner}>
      <TriangleAlert
        accessible={false}
        color={statusChip.destructive.foreground}
        size={16}
        strokeWidth={2}
      />
      <Text style={styles.text}>Atividade formalmente interditada</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: statusChip.destructive.background,
    borderColor: statusChip.destructive.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  text: {
    color: statusChip.destructive.foreground,
    flex: 1,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
    lineHeight: 18,
  },
});
