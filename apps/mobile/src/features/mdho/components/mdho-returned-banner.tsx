import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, statusChip, typography } from "@safestop/ui";

type MdhoReturnedBannerProps = {
  returnReason: string;
};

export function MdhoReturnedBanner({ returnReason }: MdhoReturnedBannerProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.title}>MDHO devolvido — corrija e reenvie.</Text>
      <Text style={styles.reason}>{returnReason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[3],
  },
  reason: {
    color: statusChip.warning.foreground,
    fontSize: typography.label.fontSize,
    lineHeight: 20,
  },
  title: {
    color: statusChip.warning.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
  },
});
