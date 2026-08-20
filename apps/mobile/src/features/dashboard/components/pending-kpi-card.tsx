import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "#450A0A",
    borderColor: "#DC2626",
    valueColor: "#FCA5A5",
  },
  warning: {
    backgroundColor: "#451A03",
    borderColor: "#D97706",
    valueColor: "#FDE68A",
  },
  info: {
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    valueColor: "#BFDBFE",
  },
  neutral: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    valueColor: "#F9FAFB",
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
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
