import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, controlHeight, DISABLED_OPACITY, radius, typography } from "@safestop/ui";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: string;
  style?: StyleProp<ViewStyle>;
};

type VariantStyle = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  indicatorColor: string;
};

const variantStyles: Record<ButtonVariant, VariantStyle> = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    textColor: colors.background,
    indicatorColor: colors.background,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    textColor: colors.foreground,
    indicatorColor: colors.foreground,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: colors.primary,
    indicatorColor: colors.primary,
  },
  destructive: {
    backgroundColor: colors.destructive,
    borderColor: colors.destructive,
    textColor: colors.foreground,
    indicatorColor: colors.foreground,
  },
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.indicatorColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: palette.textColor }]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
