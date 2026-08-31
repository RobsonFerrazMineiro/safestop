import { useMemo, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NotificationListItem } from "@safestop/types";
import { isNotificationUnread } from "@safestop/types";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

import { ScreenBackLink } from "@/components/ui";
import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { useNotificationBadgeCounts } from "@/features/notifications/hooks/use-notification-badge-counts";
import { authRoutes, stopWorkDetailRoute } from "@/lib/auth/routes";
import { confirmAction } from "@/lib/confirm-action";

import { NotificationEmpty } from "./notification-empty";
import { NotificationFilterChips } from "./notification-filter-chips";
import { NotificationItemCard } from "./notification-item-card";
import { NotificationOfflineNotice } from "./notification-offline-notice";
import {
  useConfirmNotificationAwareness,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from "../hooks";
import {
  filterNotificationItems,
  type NotificationListFilter,
} from "../utils/notification-filters";
import { NOTIFICATION_COPY } from "../utils/notification-copy";

const HEADER_ICON_SIZE = 22;

function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    const browserGlobal = globalThis as typeof globalThis & {
      navigator?: { onLine?: boolean };
    };

    return browserGlobal.navigator?.onLine !== false;
  });

  useEffect(() => {
    const browserGlobal = globalThis as typeof globalThis & {
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    browserGlobal.addEventListener?.("online", handleOnline);
    browserGlobal.addEventListener?.("offline", handleOffline);

    return () => {
      browserGlobal.removeEventListener?.("online", handleOnline);
      browserGlobal.removeEventListener?.("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

type NotificationsListScreenProps = {
  initialFilter?: NotificationListFilter;
};

export function NotificationsListScreen({ initialFilter }: NotificationsListScreenProps = {}) {
  const router = useRouter();
  useRequirePermission("notification.read");

  const { can } = useAuthorization();
  const canConfirmAwareness = can("notification.confirm_awareness");
  const isOnline = useIsOnline();

  const [activeFilter, setActiveFilter] = useState<NotificationListFilter>(initialFilter ?? "all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const { unreadCount, pendingAwarenessCount } = useNotificationBadgeCounts();
  const {
    items,
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useMyNotifications();

  const { markRead, isMarking } = useMarkNotificationRead();
  const { markAllRead, isMarkingAll } = useMarkAllNotificationsRead();
  const { confirmAwareness, isConfirming } = useConfirmNotificationAwareness();

  const filteredItems = useMemo(
    () => filterNotificationItems(items, activeFilter),
    [activeFilter, items],
  );

  async function handleOpen(item: NotificationListItem) {
    if (isOnline && isNotificationUnread(item)) {
      try {
        await markRead(item.id);
      } catch {
        // Navegação continua; erro não bloqueia deep link.
      }
    }

    router.push(stopWorkDetailRoute(item.occurrenceId));
  }

  async function handleConfirmAwareness(item: NotificationListItem) {
    if (!isOnline) {
      return;
    }

    const confirmed = await confirmAction({
      title: NOTIFICATION_COPY.confirmAwarenessCta,
      message: NOTIFICATION_COPY.confirmAwarenessDialog,
      confirmLabel: NOTIFICATION_COPY.confirmAwarenessCta,
    });

    if (!confirmed) {
      return;
    }

    setConfirmingId(item.id);

    try {
      await confirmAwareness(item.id);
      setFeedbackMessage(NOTIFICATION_COPY.awarenessConfirmed);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : NOTIFICATION_COPY.loadError);
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleMarkAllRead() {
    if (!isOnline) {
      return;
    }

    try {
      await markAllRead();
      setFeedbackMessage(NOTIFICATION_COPY.markedRead);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : NOTIFICATION_COPY.loadError);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceLoading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenBackLink
          accessibilityLabel="Voltar ao início"
          onPress={() => {
            router.replace(authRoutes.app);
          }}
        />

        <View style={styles.titleRow}>
          <Bell accessible={false} color={colors.primary} size={HEADER_ICON_SIZE} strokeWidth={2} />
          <Text accessibilityRole="header" style={styles.title}>
            {NOTIFICATION_COPY.title}
          </Text>
        </View>
        <Text style={styles.subtitle}>
          {NOTIFICATION_COPY.subtitle(unreadCount, pendingAwarenessCount)}
        </Text>

        {!isOnline ? <NotificationOfflineNotice /> : null}
        {feedbackMessage ? <Text style={styles.feedback}>{feedbackMessage}</Text> : null}

        <Pressable
          accessibilityLabel={NOTIFICATION_COPY.markAllRead}
          accessibilityRole="button"
          disabled={!isOnline || isMarkingAll || unreadCount === 0}
          style={({ pressed }) => [
            styles.markAllButton,
            (!isOnline || isMarkingAll || unreadCount === 0) && styles.markAllDisabled,
            pressed && isOnline && !isMarkingAll && unreadCount > 0 && styles.pressed,
          ]}
          onPress={() => {
            void handleMarkAllRead();
          }}
        >
          {isMarkingAll ? (
            <ActivityIndicator color={colors.foreground} size="small" />
          ) : (
            <Text style={styles.markAllText}>{NOTIFICATION_COPY.markAllRead}</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.filtersSection}>
        <NotificationFilterChips activeFilter={activeFilter} onChange={setActiveFilter} />
      </View>

      {isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{NOTIFICATION_COPY.loadError}</Text>
          <Pressable
            accessibilityLabel={NOTIFICATION_COPY.retry}
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            onPress={() => {
              void refetch();
            }}
          >
            <Text style={styles.retryText}>{NOTIFICATION_COPY.retry}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={
            filteredItems.length === 0 ? styles.listContentEmpty : styles.listContent
          }
          data={filteredItems}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<NotificationEmpty />}
          ListFooterComponent={
            hasNextPage ? (
              <Pressable
                accessibilityLabel={NOTIFICATION_COPY.loadMore}
                accessibilityRole="button"
                disabled={isFetchingNextPage}
                style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}
                onPress={() => {
                  void fetchNextPage();
                }}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>{NOTIFICATION_COPY.loadMore}</Text>
                )}
              </Pressable>
            ) : null
          }
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              refreshing={isFetching && !isFetchingNextPage}
              tintColor={colors.primary}
              onRefresh={() => {
                void refetch();
              }}
            />
          }
          renderItem={({ item }) => (
            <NotificationItemCard
              canConfirmAwareness={canConfirmAwareness}
              confirmingId={confirmingId}
              isConfirming={isConfirming}
              isMarkingRead={isMarking}
              isOnline={isOnline}
              item={item}
              onConfirmAwareness={(notification) => {
                void handleConfirmAwareness(notification);
              }}
              onOpen={(notification) => {
                void handleOpen(notification);
              }}
            />
          )}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  errorBox: {
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  errorText: {
    color: statusChip.destructive.foreground,
    fontSize: typography.label.fontSize,
  },
  feedback: {
    color: statusChip.success.foreground,
    fontSize: typography.helper.fontSize,
  },
  filtersSection: {
    flexGrow: 0,
    flexShrink: 0,
    paddingBottom: spacing[2],
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing[2],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  list: {
    flex: 1,
    flexGrow: 1,
  },
  listContent: {
    gap: spacing[3],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    paddingVertical: spacing[2],
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  markAllButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.button,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  markAllDisabled: {
    opacity: 0.5,
  },
  markAllText: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.button,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing[4],
  },
  retryText: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
  },
  title: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "700",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
});
