import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { DASHBOARD_METRIC_CATALOG } from "@safestop/types";

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
          <Pressable
            accessibilityLabel={DASHBOARD_COPY.retry}
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>{DASHBOARD_COPY.retry}</Text>
          </Pressable>
        </View>
      ) : null}

      {showInitialLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#F97316" size="small" />
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
    gap: 10,
  },
  container: {
    gap: 12,
    width: "100%",
  },
  errorBox: {
    backgroundColor: "#450A0A",
    borderColor: "#DC2626",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyPersonal: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#7F1D1D",
    borderRadius: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: "#FEE2E2",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
