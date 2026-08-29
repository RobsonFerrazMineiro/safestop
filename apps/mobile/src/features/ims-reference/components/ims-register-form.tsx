import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";

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

      <TextField
        autoCapitalize="characters"
        autoCorrect={false}
        error={error ?? undefined}
        helperText={!error ? IMS_REFERENCE_COPY.formatHint : undefined}
        inputStyle={styles.monospaceInput}
        label={IMS_REFERENCE_COPY.codeLabel}
        placeholder={IMS_REFERENCE_COPY.placeholder}
        value={value}
        onChangeText={onChange}
      />

      {!isOnline ? <Text style={styles.offline}>{IMS_REFERENCE_COPY.offlineToast}</Text> : null}
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
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
      {!isOnline ? <Text style={styles.offline}>{IMS_REFERENCE_COPY.offlineToast}</Text> : null}
      <Button
        accessibilityLabel={
          isRegistering ? IMS_REFERENCE_COPY.registering : IMS_REFERENCE_COPY.registerCta
        }
        disabled={isRegistering}
        loading={isRegistering}
        onPress={onRegister}
      >
        {IMS_REFERENCE_COPY.registerCta}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  helper: {
    color: statusChip.info.foreground,
    fontSize: typography.body.fontSize,
    lineHeight: 20,
  },
  monospaceInput: {
    fontFamily: "monospace",
    fontSize: typography.cardTitle.fontSize,
  },
  offline: {
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
  },
});
