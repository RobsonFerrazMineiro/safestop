import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, controlHeight, spacing, typography } from "@safestop/ui";

const BACK_ICON_SIZE = 18;

type ScreenBackLinkProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * Link discreto de navegação secundária: ← Voltar (Lucide ArrowLeft).
 * Usado nos headers internos Mobile — não é botão preenchido.
 */
export function ScreenBackLink({ accessibilityLabel, onPress }: ScreenBackLinkProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
      onPress={onPress}
    >
      <ArrowLeft accessible={false} color={colors.primary} size={BACK_ICON_SIZE} strokeWidth={2} />
      <Text style={styles.label}>Voltar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.primary,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  root: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing[1],
    minHeight: controlHeight.mobile,
  },
});
