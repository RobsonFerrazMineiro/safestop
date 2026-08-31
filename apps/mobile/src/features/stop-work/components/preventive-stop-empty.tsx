import { OctagonAlert } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";

type PreventiveStopEmptyProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function PreventiveStopEmpty({
  title = "Nenhuma Paralisação Preventiva encontrada.",
  description = "As Paralisações Preventivas registradas na organização ativa aparecerão aqui.",
  actionLabel,
  onAction,
}: PreventiveStopEmptyProps) {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <OctagonAlert
        accessible={false}
        color={colors.foregroundMuted}
        size={28}
        strokeWidth={1.75}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction ? (
        <Button accessibilityLabel={actionLabel} variant="secondary" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[8],
  },
  description: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
    textAlign: "center",
  },
  title: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
});
