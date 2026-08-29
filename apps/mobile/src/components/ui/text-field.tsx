import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { colors, controlHeight, radius, typography } from "@safestop/ui";

type TextFieldProps = Omit<TextInputProps, "editable" | "style"> & {
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  label,
  helperText,
  error,
  disabled = false,
  inputStyle,
  onFocus,
  onBlur,
  placeholderTextColor = colors.foregroundMuted,
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        editable={!disabled}
        placeholderTextColor={placeholderTextColor}
        style={[
          styles.input,
          isFocused && !hasError && styles.inputFocused,
          hasError && styles.inputError,
          disabled && styles.inputDisabled,
          inputProps.multiline && styles.multiline,
          inputStyle,
        ]}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        {...inputProps}
      />

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {!error && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  error: {
    color: colors.destructive,
    fontSize: typography.helper.fontSize,
    fontWeight: typography.helper.fontWeight,
  },
  helper: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    fontWeight: typography.helper.fontWeight,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    minHeight: controlHeight.mobile,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  label: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  multiline: {
    minHeight: controlHeight.mobile * 2,
    textAlignVertical: "top",
  },
});
