import { useMemo, useState, useEffect } from "react";
import { useRouter } from "expo-router";
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
        <Pressable
          accessibilityLabel="Voltar ao início"
          accessibilityRole="button"
          onPress={() => {
            router.replace(authRoutes.app);
          }}
        >
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>

        <Text accessibilityRole="header" style={styles.title}>
          {NOTIFICATION_COPY.title}
        </Text>
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
            <ActivityIndicator color="#F9FAFB" size="small" />
          ) : (
            <Text style={styles.markAllText}>{NOTIFICATION_COPY.markAllRead}</Text>
          )}
        </Pressable>
      </View>

      <NotificationFilterChips activeFilter={activeFilter} onChange={setActiveFilter} />

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
          contentContainerStyle={styles.listContent}
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
                  <ActivityIndicator color="#F97316" size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>{NOTIFICATION_COPY.loadMore}</Text>
                )}
              </Pressable>
            ) : null
          }
          refreshControl={
            <RefreshControl
              colors={["#F97316"]}
              refreshing={isFetching && !isFetchingNextPage}
              tintColor="#F97316"
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  errorBox: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  errorText: {
    color: "#F87171",
    fontSize: 14,
  },
  feedback: {
    color: "#86EFAC",
    fontSize: 13,
  },
  header: {
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 8,
  },
  loadMoreText: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600",
  },
  markAllButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  markAllDisabled: {
    opacity: 0.5,
  },
  markAllText: {
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#374151",
    borderRadius: 8,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  retryText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  title: {
    color: "#F97316",
    fontSize: 24,
    fontWeight: "700",
  },
});
