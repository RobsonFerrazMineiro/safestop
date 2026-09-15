import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";

import { DashboardOfflineNotice } from "./dashboard-offline-notice";
import { PendingKpiCard } from "./pending-kpi-card";
import { DASHBOARD_COPY } from "../utils/dashboard-copy";
import { hasMetricPermission } from "../utils/kpi-config";
import { notificationsAwarenessRoute, stopWorkAttentionRoute } from "../utils/dashboard-deep-links";
import { DASHBOARD_ATTENTION_SCOPE } from "@/features/stop-work/utils/dashboard-list-params";

type AttentionMetricKey =
  "myOverdueActions" | "myPendingAwareness" | "myPendingActions" | "myDueSoonActions";

type MobileHomeAttentionSectionProps = {
  myPendingActions: number | undefined;
  myOverdueActions: number | undefined;
  myPendingAwareness: number | undefined;
  myDueSoonActions: number | undefined;
  isLoading: boolean;
  isAwarenessLoading: boolean;
  isError: boolean;
  isOnline: boolean;
  hasCachedData: boolean;
  enabled: boolean;
  canReadNotifications: boolean;
  can: (code: import("@safestop/types").PermissionCode) => boolean;
  canAny: (codes: import("@safestop/types").PermissionCode[]) => boolean;
  onRetry: () => void;
};

const PERSONAL_ORDER: AttentionMetricKey[] = [
  "myOverdueActions",
  "myPendingAwareness",
  "myPendingActions",
  "myDueSoonActions",
];

function valueForAttentionMetric(
  key: AttentionMetricKey,
  values: {
    myOverdueActions: number | undefined;
    myPendingAwareness: number | undefined;
    myPendingActions: number | undefined;
    myDueSoonActions: number | undefined;
  },
): number | undefined {
  switch (key) {
    case "myOverdueActions":
      return values.myOverdueActions;
    case "myPendingAwareness":
      return values.myPendingAwareness;
    case "myPendingActions":
      return values.myPendingActions;
    case "myDueSoonActions":
      return values.myDueSoonActions;
  }
}

export function MobileHomeAttentionSection({
  myPendingActions,
  myOverdueActions,
  myPendingAwareness,
  myDueSoonActions,
  isLoading,
  isAwarenessLoading,
  isError,
  isOnline,
  hasCachedData,
  enabled,
  canReadNotifications,
  can,
  canAny,
  onRetry,
}: MobileHomeAttentionSectionProps) {
  const router = useRouter();

  if (!enabled) {
    return null;
  }

  const showOfflineNotice = !isOnline && hasCachedData;
  const showInitialLoading = isLoading && !hasCachedData;
  const showError = isError && !hasCachedData;

  const attentionCards = PERSONAL_ORDER.flatMap((key) => {
    if (key === "myPendingAwareness" && !canReadNotifications) {
      return [];
    }

    if (!hasMetricPermission(can, canAny, key)) {
      return [];
    }

    const value = valueForAttentionMetric(key, {
      myOverdueActions,
      myPendingAwareness,
      myPendingActions,
      myDueSoonActions,
    });

    const onPress =
      key === "myOverdueActions"
        ? () => {
            router.push(stopWorkAttentionRoute("overdue", DASHBOARD_ATTENTION_SCOPE.mine));
          }
        : key === "myPendingAwareness"
          ? () => {
              router.push(notificationsAwarenessRoute());
            }
          : key === "myPendingActions"
            ? () => {
                router.push(stopWorkAttentionRoute("pending", DASHBOARD_ATTENTION_SCOPE.mine));
              }
            : key === "myDueSoonActions"
              ? () => {
                  router.push(stopWorkAttentionRoute("due-soon", DASHBOARD_ATTENTION_SCOPE.mine));
                }
              : undefined;

    return [
      {
        key,
        value,
        isLoading:
          key === "myPendingAwareness"
            ? showInitialLoading || isAwarenessLoading
            : showInitialLoading,
        onPress,
      },
    ];
  });

  const showEmptyPersonal =
    !showOfflineNotice &&
    !showInitialLoading &&
    !showError &&
    attentionCards.length > 0 &&
    attentionCards.every((card) => card.value === 0 || card.value === undefined);

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {DASHBOARD_COPY.attentionSectionTitle}
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
          {PERSONAL_ORDER.map((key) => (
            <View key={key} style={styles.gridItem}>
              <PendingKpiCard isLoading metricKey={key} value={undefined} />
            </View>
          ))}
        </View>
      ) : null}

      {!showInitialLoading && !showError && attentionCards.length > 0 ? (
        <>
          <View style={styles.grid}>
            {attentionCards.map((card) => (
              <View key={card.key} style={styles.gridItem}>
                <PendingKpiCard
                  accessibilityHint={card.onPress ? "Abrir detalhes" : undefined}
                  isLoading={card.isLoading}
                  metricKey={card.key}
                  value={card.value}
                  onPress={card.onPress}
                />
              </View>
            ))}
          </View>

          {showEmptyPersonal ? (
            <Text accessibilityRole="text" style={styles.emptyPersonal}>
              {DASHBOARD_COPY.emptyPersonal}
            </Text>
          ) : null}
        </>
      ) : null}

      {!showInitialLoading && !showError && attentionCards.length === 0 ? (
        <Text style={styles.emptyPersonal}>{DASHBOARD_COPY.emptyPersonal}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
    width: "100%",
  },
  emptyPersonal: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
    textAlign: "center",
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
  sectionTitle: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
