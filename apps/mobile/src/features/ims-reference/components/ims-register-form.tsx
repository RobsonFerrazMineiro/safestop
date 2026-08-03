import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IMS_REFERENCE_COPY } from "../utils/ims-reference-copy";

type ImsRegisterFormProps = {
  value: string;
  error: string | null;
  isOnline: boolean;
  onChange: (value: string) => void;
};

export function ImsRegisterForm({ value, error, isOnline, onChange }: ImsRegisterFormProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.helper}>{IMS_REFERENCE_COPY.helper}</Text>

      <Text style={styles.label}>{IMS_REFERENCE_COPY.codeLabel}</Text>
      <TextInput
        accessibilityLabel={IMS_REFERENCE_COPY.codeLabel}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={isOnline}
        placeholder={IMS_REFERENCE_COPY.placeholder}
        placeholderTextColor="#6B7280"
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChange}
      />
      <Text style={styles.formatHint}>{IMS_REFERENCE_COPY.formatHint}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type ImsRegisterFooterProps = {
  isOnline: boolean;
  isRegistering: boolean;
  onRegister: () => void;
};

export function ImsRegisterFooter({ isOnline, isRegistering, onRegister }: ImsRegisterFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {!isOnline ? <Text style={styles.offline}>{IMS_REFERENCE_COPY.offlineToast}</Text> : null}
      <Pressable
        accessibilityLabel={
          isRegistering ? IMS_REFERENCE_COPY.registering : IMS_REFERENCE_COPY.registerCta
        }
        accessibilityRole="button"
        disabled={!isOnline || isRegistering}
        style={({ pressed }) => [
          styles.registerButton,
          (!isOnline || isRegistering) && styles.buttonDisabled,
          pressed && isOnline && !isRegistering && styles.pressed,
        ]}
        onPress={onRegister}
      >
        {isRegistering ? (
          <ActivityIndicator color="#EFF6FF" size="small" />
        ) : (
          <Text style={styles.registerText}>{IMS_REFERENCE_COPY.registerCta}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.5,
  },
  container: {
    gap: 8,
  },
  error: {
    color: "#F87171",
    fontSize: 13,
  },
  footer: {
    backgroundColor: "#0F1115",
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  formatHint: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  helper: {
    color: "#93C5FD",
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontFamily: "monospace",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#F87171",
  },
  label: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
  offline: {
    color: "#93C5FD",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  registerButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  registerText: {
    color: "#EFF6FF",
    fontSize: 15,
    fontWeight: "700",
  },
});
