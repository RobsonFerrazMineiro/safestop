import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, elevation, radius, spacing } from "@safestop/ui";

export type CardVariant = "default" | "muted";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const cardElevation = elevation.card.native;

export function Card({
  children,
  onPress,
  variant = "default",
  style,
  accessibilityLabel,
}: CardProps) {
  const surfaceStyle = [
    styles.base,
    variant === "muted" ? styles.muted : styles.default,
    cardElevation,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={({ pressed }) => [surfaceStyle, pressed && styles.pressed]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={surfaceStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
});
