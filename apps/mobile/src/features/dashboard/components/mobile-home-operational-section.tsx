import { useRouter } from "expo-router";
import { ClipboardCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DashboardMetricKey } from "@safestop/types";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { hseApprovalQueueRoute } from "@/lib/auth/routes";

import { DashboardOfflineNotice } from "./dashboard-offline-notice";
import { PendingKpiCard } from "./pending-kpi-card";
import { DASHBOARD_COPY } from "../utils/dashboard-copy";
import { routeForHomeMetric } from "../utils/kpi-config";
import { readHomeMetricValue } from "../utils/select-operational-kpis";

type MobileHomeOperationalSectionProps = {
  kpis: import("@safestop/types").DashboardKpis | undefined;
  metricKeys: DashboardMetricKey[];
  isLoading: boolean;
  isError: boolean;
  isOnline: boolean;
  hasCachedData: boolean;
  enabled: boolean;
  showHseApprovalCta: boolean;
  onRetry: () => void;
};

export function MobileHomeOperationalSection({
  kpis,
  metricKeys,
  isLoading,
  isError,
  isOnline,
  hasCachedData,
  enabled,
  showHseApprovalCta,
  onRetry,
}: MobileHomeOperationalSectionProps) {
  const router = useRouter();

  if (!enabled) {
    return null;
  }

  const showOfflineNotice = !isOnline && hasCachedData;
  const showInitialLoading = isLoading && !hasCachedData;
  const showError = isError && !hasCachedData;
  const showSection =
    showInitialLoading ||
    showError ||
    metricKeys.length > 0 ||
    showHseApprovalCta ||
    showOfflineNotice;

  if (!showSection) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {DASHBOARD_COPY.operationalSectionTitle}
      </Text>

      {showOfflineNotice ? <DashboardOfflineNotice /> : null}

      {showError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{DASHBOARD_COPY.loadError}</Text>
          <Button accessibilityLabel={DASHBOARD_COPY.retry} variant="destructive" onPress={onRetry}>
            {DASHBOARD_COPY.retry}
          </Button>
        </View>
      ) : null}

      {showInitialLoading ? (
        <View style={styles.grid}>
          {[0, 1].map((slot) => (
            <View key={slot} style={styles.gridItem}>
              <PendingKpiCard isLoading metricKey="scopedOpenOccurrences" value={undefined} />
            </View>
          ))}
        </View>
      ) : null}

      {!showInitialLoading && !showError && metricKeys.length > 0 ? (
        <View style={styles.grid}>
          {metricKeys.map((metricKey) => {
            const route = routeForHomeMetric(metricKey);

            return (
              <View key={metricKey} style={styles.gridItem}>
                <PendingKpiCard
                  accessibilityHint="Abrir detalhes"
                  isLoading={isLoading}
                  metricKey={metricKey}
                  tone={undefined}
                  value={readHomeMetricValue(kpis, metricKey)}
                  onPress={
                    route
                      ? () => {
                          router.push(route);
                        }
                      : undefined
                  }
                />
              </View>
            );
          })}
        </View>
      ) : null}

      {!showInitialLoading && !showError && metricKeys.length === 0 && !showHseApprovalCta ? (
        <Text style={styles.emptyOperational}>{DASHBOARD_COPY.emptyOperational}</Text>
      ) : null}

      {showHseApprovalCta ? (
        <Pressable
          accessibilityLabel={DASHBOARD_COPY.hseApprovalCta}
          accessibilityRole="button"
          style={({ pressed }) => [styles.hseCta, pressed && styles.pressed]}
          onPress={() => {
            router.push(hseApprovalQueueRoute);
          }}
        >
          <ClipboardCheck
            accessible={false}
            color={statusChip.warning.foreground}
            size={18}
            strokeWidth={2}
          />
          <Text style={styles.hseCtaText}>{DASHBOARD_COPY.hseApprovalCta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
    width: "100%",
  },
  emptyOperational: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: statusChip.destructive.background,
    borderColor: statusChip.destructive.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[3],
  },
  errorText: {
    color: statusChip.destructive.foreground,
    fontSize: typography.label.fontSize,
    lineHeight: 20,
  },
  grid: {
    columnGap: spacing[2],
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing[2],
  },
  gridItem: {
    flexBasis: "48%",
    flexGrow: 1,
    maxWidth: "48%",
    minWidth: "48%",
  },
  hseCta: {
    alignItems: "center",
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[3],
  },
  hseCtaText: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  sectionTitle: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
