import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { DashboardOfflineNotice } from "./dashboard-offline-notice";
import { PendingKpiCard } from "./pending-kpi-card";
import { DASHBOARD_COPY } from "../utils/dashboard-copy";
import {
  dashboardDeepLinks,
  notificationsAwarenessRoute,
  stopWorkAttentionRoute,
} from "../utils/dashboard-deep-links";

type PendingCardConfig = {
  key: "myOverdueActions" | "myPendingAwareness" | "myPendingActions" | "activeOccurrences";
  value: number | null | undefined;
  tone: "danger" | "warning" | "neutral" | "info";
  isLoading: boolean;
  onPress: () => void;
};

type MobileHomePendingSectionProps = {
  myPendingActions: number | undefined;
  myOverdueActions: number | undefined;
  myPendingAwareness: number | undefined;
  activeOccurrences: number | null | undefined;
  isLoading: boolean;
  isAwarenessLoading: boolean;
  isError: boolean;
  isOnline: boolean;
  hasCachedData: boolean;
  enabled: boolean;
  canReadNotifications: boolean;
  onRetry: () => void;
};

const LOADING_PLACEHOLDER_KEYS = [
  "myOverdueActions",
  "myPendingAwareness",
  "myPendingActions",
  "activeOccurrences",
] as const;

export function MobileHomePendingSection({
  myPendingActions,
  myOverdueActions,
  myPendingAwareness,
  activeOccurrences,
  isLoading,
  isAwarenessLoading,
  isError,
  isOnline,
  hasCachedData,
  enabled,
  canReadNotifications,
  onRetry,
}: MobileHomePendingSectionProps) {
  const router = useRouter();

  if (!enabled) {
    return null;
  }

  const showOfflineNotice = !isOnline && hasCachedData;
  const showInitialLoading = isLoading && !hasCachedData;
  const showError = isError && !hasCachedData;
  const showActiveOccurrences = activeOccurrences !== null && activeOccurrences !== undefined;

  const pendingCards: PendingCardConfig[] = [
    {
      key: "myOverdueActions",
      value: myOverdueActions,
      tone: "danger",
      isLoading: showInitialLoading,
      onPress: () => {
        router.push(stopWorkAttentionRoute("overdue"));
      },
    },
    ...(canReadNotifications
      ? [
          {
            key: "myPendingAwareness" as const,
            value: myPendingAwareness,
            tone: "warning" as const,
            isLoading: showInitialLoading || isAwarenessLoading,
            onPress: () => {
              router.push(notificationsAwarenessRoute());
            },
          },
        ]
      : []),
    {
      key: "myPendingActions",
      value: myPendingActions,
      tone: "neutral",
      isLoading: showInitialLoading,
      onPress: () => {
        router.push(dashboardDeepLinks.stopWorkAll);
      },
    },
    ...(showActiveOccurrences
      ? [
          {
            key: "activeOccurrences" as const,
            value: activeOccurrences,
            tone: "info" as const,
            isLoading: isLoading,
            onPress: () => {
              router.push(dashboardDeepLinks.stopWorkAll);
            },
          },
        ]
      : []),
  ];

  const showEmptyPersonal =
    !showOfflineNotice &&
    !showInitialLoading &&
    !showError &&
    myPendingActions === 0 &&
    myOverdueActions === 0 &&
    (myPendingAwareness === undefined || myPendingAwareness === 0) &&
    !showActiveOccurrences;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {DASHBOARD_COPY.sectionTitle}
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
          {LOADING_PLACEHOLDER_KEYS.map((key) => (
            <View key={key} style={styles.gridItem}>
              <PendingKpiCard isLoading metricKey={key} value={undefined} />
            </View>
          ))}
        </View>
      ) : null}

      {!showInitialLoading && !showError ? (
        <>
          <View style={styles.grid}>
            {pendingCards.map((card) => (
              <View key={card.key} style={styles.gridItem}>
                <PendingKpiCard
                  accessibilityHint="Abrir detalhes"
                  isLoading={card.isLoading}
                  metricKey={card.key}
                  tone={card.tone}
                  value={card.value ?? undefined}
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
