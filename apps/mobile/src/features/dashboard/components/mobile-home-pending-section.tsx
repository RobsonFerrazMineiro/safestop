import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { DASHBOARD_METRIC_CATALOG } from "@safestop/types";
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

  const personalCards = [
    {
      key: "myOverdueActions",
      label: DASHBOARD_METRIC_CATALOG.myOverdueActions.label,
      value: myOverdueActions,
      tone: "danger" as const,
      isLoading: showInitialLoading,
      onPress: () => {
        router.push(stopWorkAttentionRoute("overdue"));
      },
    },
    ...(canReadNotifications
      ? [
          {
            key: "myPendingAwareness",
            label: DASHBOARD_METRIC_CATALOG.myPendingAwareness.label,
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
      label: DASHBOARD_METRIC_CATALOG.myPendingActions.label,
      value: myPendingActions,
      tone: "neutral" as const,
      isLoading: showInitialLoading,
      onPress: () => {
        router.push(dashboardDeepLinks.stopWorkAll);
      },
    },
  ];

  const showActiveOccurrences = activeOccurrences !== null && activeOccurrences !== undefined;

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
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : null}

      {!showInitialLoading && !showError ? (
        <View style={styles.cards}>
          {personalCards.map((card) => (
            <PendingKpiCard
              key={card.key}
              accessibilityHint="Abrir detalhes"
              isLoading={card.isLoading}
              label={card.label}
              tone={card.tone}
              value={card.value}
              onPress={card.onPress}
            />
          ))}

          {showActiveOccurrences ? (
            <PendingKpiCard
              accessibilityHint="Abrir paralisações"
              isLoading={isLoading}
              label={DASHBOARD_METRIC_CATALOG.activeOccurrences.label}
              tone="info"
              value={activeOccurrences}
              onPress={() => {
                router.push(dashboardDeepLinks.stopWorkAll);
              }}
            />
          ) : null}

          {!showOfflineNotice &&
          myPendingActions === 0 &&
          myOverdueActions === 0 &&
          (myPendingAwareness === undefined || myPendingAwareness === 0) &&
          !showActiveOccurrences ? (
            <Text accessibilityRole="text" style={styles.emptyPersonal}>
              {DASHBOARD_COPY.emptyPersonal}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing[2],
  },
  container: {
    gap: spacing[3],
    width: "100%",
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
  emptyPersonal: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
    textAlign: "center",
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  sectionTitle: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
