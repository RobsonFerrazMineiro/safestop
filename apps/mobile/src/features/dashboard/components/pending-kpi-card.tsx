import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import {
  AlarmClock,
  Bell,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ListTodo,
  OctagonAlert,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react-native";
import type { DashboardMetricKey } from "@safestop/types";
import { DASHBOARD_METRIC_CATALOG } from "@safestop/types";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

import { toneForHomeMetric, type HomeKpiTone } from "../utils/kpi-config";

type PendingKpiCardProps = {
  metricKey: DashboardMetricKey;
  value: number | undefined;
  isLoading?: boolean;
  tone?: HomeKpiTone;
  accessibilityHint?: string;
  onPress?: () => void;
};

const TONE_STYLES: Record<
  HomeKpiTone,
  { backgroundColor: string; borderColor: string; iconColor: string }
> = {
  danger: {
    backgroundColor: statusChip.destructive.background,
    borderColor: statusChip.destructive.border,
    iconColor: statusChip.destructive.foreground,
  },
  warning: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    iconColor: statusChip.warning.foreground,
  },
  info: {
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
    iconColor: statusChip.info.foreground,
  },
  neutral: {
    backgroundColor: statusChip.muted.background,
    borderColor: statusChip.muted.border,
    iconColor: statusChip.muted.foreground,
  },
};

const METRIC_ICONS: Partial<Record<DashboardMetricKey, LucideIcon>> = {
  myPendingActions: ListTodo,
  myOverdueActions: AlarmClock,
  myDueSoonActions: Clock,
  myPendingAwareness: Bell,
  activeOccurrences: OctagonAlert,
  scopedOpenOccurrences: OctagonAlert,
  scopedPendingAwareness: Bell,
  pendingEvaluation: ClipboardList,
  activeInterdictions: ShieldAlert,
  awaitingValidation: ClipboardCheck,
  mdhoPendingApproval: ClipboardCheck,
  dueSoonActionItems: Clock,
};

const KPI_ICON_SIZE = 16;
const KPI_VALUE_MIN_SCALE = 0.75;

function detailForMetric(key: DashboardMetricKey): string {
  return DASHBOARD_METRIC_CATALOG[key].stock ? "Independente do período" : "No período selecionado";
}

export function PendingKpiCard({
  metricKey,
  value,
  isLoading = false,
  tone,
  accessibilityHint,
  onPress,
}: PendingKpiCardProps) {
  const resolvedTone = tone ?? toneForHomeMetric(metricKey);
  const toneStyle = TONE_STYLES[resolvedTone];
  const label = DASHBOARD_METRIC_CATALOG[metricKey].label;
  const detail = detailForMetric(metricKey);
  const displayValue = value === undefined ? "—" : String(value);
  const accessibilityLabel = `${label}: ${displayValue}`;
  const MetricIcon = METRIC_ICONS[metricKey] ?? OctagonAlert;

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
          borderLeftColor: toneStyle.borderColor,
        },
        onPress && pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <Text numberOfLines={2} style={styles.label}>
          {label}
        </Text>
        <MetricIcon
          accessible={false}
          color={toneStyle.iconColor}
          size={KPI_ICON_SIZE}
          strokeWidth={2}
        />
      </View>

      <View style={styles.valueRow}>
        {isLoading ? (
          <ActivityIndicator color={colors.foreground} size="small" />
        ) : (
          <Text
            adjustsFontSizeToFit
            minimumFontScale={KPI_VALUE_MIN_SCALE}
            numberOfLines={1}
            style={styles.value}
          >
            {displayValue}
          </Text>
        )}
      </View>

      <View style={styles.divider} />

      <Text numberOfLines={1} style={styles.detail}>
        {detail}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    borderLeftWidth: 3,
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    gap: spacing[1],
    minHeight: controlHeight.mobile * 2 + spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  detail: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: 14,
    textAlign: "left",
  },
  divider: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[1],
    justifyContent: "space-between",
  },
  label: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    letterSpacing: 0.4,
    lineHeight: 14,
    textAlign: "left",
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
  value: {
    color: colors.foreground,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    textAlign: "left",
  },
  valueRow: {
    alignItems: "flex-start",
    minHeight: 28,
  },
});
