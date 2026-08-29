import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { radius, statusChip, typography } from "@safestop/ui";

type PendingKpiCardTone = "danger" | "warning" | "info" | "neutral";

type PendingKpiCardProps = {
  label: string;
  value: number | undefined;
  isLoading?: boolean;
  tone?: PendingKpiCardTone;
  accessibilityHint?: string;
  onPress?: () => void;
};

const TONE_STYLES: Record<
  PendingKpiCardTone,
  { backgroundColor: string; borderColor: string; valueColor: string }
> = {
  danger: {
    backgroundColor: statusChip.destructive.background,
    borderColor: statusChip.destructive.border,
    valueColor: statusChip.destructive.foreground,
  },
  warning: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    valueColor: statusChip.warning.foreground,
  },
  info: {
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
    valueColor: statusChip.info.foreground,
  },
  neutral: {
    backgroundColor: statusChip.muted.background,
    borderColor: statusChip.muted.border,
    valueColor: statusChip.muted.foreground,
  },
};

export function PendingKpiCard({
  label,
  value,
  isLoading = false,
  tone = "neutral",
  accessibilityHint,
  onPress,
}: PendingKpiCardProps) {
  const toneStyle = TONE_STYLES[tone];
  const displayValue = value === undefined ? "—" : String(value);
  const accessibilityLabel = `${label}: ${displayValue}`;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: toneStyle.backgroundColor,
          borderColor: toneStyle.borderColor,
        },
        onPress && pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        {isLoading ? (
          <ActivityIndicator color={toneStyle.valueColor} size="small" />
        ) : (
          <Text style={[styles.value, { color: toneStyle.valueColor }]}>{displayValue}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 6,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: statusChip.muted.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
  },
  valueRow: {
    alignItems: "flex-start",
    minHeight: 32,
  },
});
