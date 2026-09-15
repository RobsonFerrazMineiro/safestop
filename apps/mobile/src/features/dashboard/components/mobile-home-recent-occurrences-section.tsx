import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { DashboardRecentOccurrenceItem } from "@safestop/types";
import { isOccurrenceStatus } from "@safestop/types";
import { colors, radius, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { getOccurrenceStatusLabel } from "@/features/occurrences/utils/occurrence-labels";
import { stopWorkDetailRoute, stopWorkRoute } from "@/lib/auth/routes";

import { DASHBOARD_COPY } from "../utils/dashboard-copy";

const RECENT_HOME_LIMIT = 3;

type MobileHomeRecentOccurrencesSectionProps = {
  items: DashboardRecentOccurrenceItem[];
  isLoading: boolean;
  isError: boolean;
  enabled: boolean;
  onRetry: () => void;
};

function RecentOccurrenceRow({ item }: { item: DashboardRecentOccurrenceItem }) {
  const router = useRouter();
  const statusLabel = isOccurrenceStatus(item.status)
    ? getOccurrenceStatusLabel(item.status)
    : item.status;
  const meta = [item.areaName, statusLabel].filter(Boolean).join(" · ");

  return (
    <Pressable
      accessibilityLabel={`Paralisação ${item.publicCode}, ${item.title}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => {
        router.push(stopWorkDetailRoute(item.id));
      }}
    >
      <Text numberOfLines={1} style={styles.code}>
        {item.publicCode}
      </Text>
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
      {meta.length > 0 ? (
        <Text numberOfLines={1} style={styles.meta}>
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function MobileHomeRecentOccurrencesSection({
  items,
  isLoading,
  isError,
  enabled,
  onRetry,
}: MobileHomeRecentOccurrencesSectionProps) {
  const router = useRouter();

  if (!enabled) {
    return null;
  }

  const visibleItems = items.slice(0, RECENT_HOME_LIMIT);
  const showInitialLoading = isLoading && items.length === 0;
  const showError = isError && items.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {DASHBOARD_COPY.recentSectionTitle}
        </Text>

        {!showInitialLoading && !showError ? (
          <Pressable
            accessibilityLabel={DASHBOARD_COPY.recentViewAll}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}
            onPress={() => {
              router.push(stopWorkRoute);
            }}
          >
            <Text style={styles.viewAllText}>{DASHBOARD_COPY.recentViewAll}</Text>
          </Pressable>
        ) : null}
      </View>

      {showError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{DASHBOARD_COPY.loadError}</Text>
          <Button accessibilityLabel={DASHBOARD_COPY.retry} variant="destructive" onPress={onRetry}>
            {DASHBOARD_COPY.retry}
          </Button>
        </View>
      ) : null}

      {showInitialLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : null}

      {!showInitialLoading && !showError && visibleItems.length === 0 ? (
        <Text style={styles.emptyText}>{DASHBOARD_COPY.recentEmpty}</Text>
      ) : null}

      {!showInitialLoading && !showError && visibleItems.length > 0 ? (
        <View style={styles.list}>
          {visibleItems.map((item) => (
            <RecentOccurrenceRow key={item.id} item={item} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  code: {
    color: colors.primary,
    fontFamily: "monospace",
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
  container: {
    gap: spacing[2],
    width: "100%",
  },
  emptyText: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  errorBox: {
    gap: spacing[2],
  },
  errorText: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    lineHeight: 20,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  list: {
    gap: spacing[2],
  },
  loadingRow: {
    alignItems: "flex-start",
    paddingVertical: spacing[1],
  },
  meta: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[1] / 2,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  sectionTitle: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    lineHeight: 18,
  },
  viewAllButton: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing[1],
  },
  viewAllText: {
    color: colors.primary,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
});
