import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button, Card } from "@/components/ui";
import { Can } from "@/features/authorization/components/can";
import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { MobileHomePendingSection, useHomePendingData } from "@/features/dashboard";
import { showHseApprovalQueue } from "@/features/hse-approval";
import {
  getNotificationAccessibilityLabel,
  NotificationTabBadge,
  useNotificationBadgeCounts,
} from "@/features/notifications";
import { useAuth } from "@/hooks/use-auth";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import {
  authRoutes,
  hseApprovalQueueRoute,
  notificationsRoute,
  stopWorkNewRoute,
  stopWorkRoute,
} from "@/lib/auth/routes";

export default function AuthenticatedHomeScreen() {
  const router = useRouter();
  const { user, isRefreshing } = useAuth();
  const { can, isPlatformAdmin } = useAuthorization();
  const { activeOrganization, hasMultipleOrganizations } = useActiveOrganization();
  const pendingData = useHomePendingData();
  const {
    refresh: refreshPendingData,
    isFetching: isPendingFetching,
    ...pendingSectionProps
  } = pendingData;
  const [isRefreshingHome, setIsRefreshingHome] = useState(false);

  const canViewHseQueue = showHseApprovalQueue({
    currentUserId: user?.id ?? "",
    isPlatformAdmin,
    permissions: {
      mdhoApprove: can("mdho.approve"),
      mdhoReturn: can("mdho.return"),
    },
  });
  const canViewNotifications = can("notification.read");
  const { unreadCount, pendingAwarenessCount } = useNotificationBadgeCounts();
  const notificationBadgeLabel = getNotificationAccessibilityLabel({
    unreadCount,
    pendingAwarenessCount,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshingHome(true);

    try {
      await refreshPendingData();
    } finally {
      setIsRefreshingHome(false);
    }
  }, [refreshPendingData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={isRefreshingHome || isPendingFetching}
            tintColor={colors.primary}
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        }
      >
        <Text style={styles.title}>SafeStop</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

        {activeOrganization ? (
          <Card style={styles.organizationCard} variant="muted">
            <Text style={styles.organizationLabel}>Organização ativa</Text>
            <Text style={styles.organizationName}>{activeOrganization.name}</Text>
            {activeOrganization.code ? (
              <Text style={styles.organizationCode}>{activeOrganization.code}</Text>
            ) : null}
          </Card>
        ) : null}

        {hasMultipleOrganizations ? (
          <Button
            accessibilityLabel="Trocar organização"
            style={styles.fullWidthShortcut}
            variant="secondary"
            onPress={() => {
              router.push(authRoutes.organizations);
            }}
          >
            Trocar organização
          </Button>
        ) : null}

        {isRefreshing ? (
          <View style={styles.refreshing}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.refreshingText}>Revalidando sessão…</Text>
          </View>
        ) : null}

        <MobileHomePendingSection
          {...pendingSectionProps}
          onRetry={() => {
            void refreshPendingData();
          }}
        />

        <Text accessibilityRole="header" style={styles.shortcutsTitle}>
          Atalhos
        </Text>

        <View style={styles.shortcuts}>
          <Can permission="occurrence.read">
            <Button
              accessibilityLabel="Ver paralisações"
              style={styles.fullWidthShortcut}
              onPress={() => {
                router.push(stopWorkRoute);
              }}
            >
              Paralisações
            </Button>
          </Can>

          <Can permission="occurrence.create">
            <Button
              accessibilityLabel="Nova paralisação preventiva"
              style={styles.fullWidthShortcut}
              variant="secondary"
              onPress={() => {
                router.push(stopWorkNewRoute);
              }}
            >
              Nova Paralisação
            </Button>
          </Can>

          {canViewNotifications ? (
            <Pressable
              accessibilityLabel={notificationBadgeLabel}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.notificationShortcut,
                pressed && styles.shortcutPressed,
              ]}
              onPress={() => {
                router.push(notificationsRoute);
              }}
            >
              <Text style={styles.notificationShortcutText}>Notificações</Text>
              <NotificationTabBadge counts={{ unreadCount, pendingAwarenessCount }} />
            </Pressable>
          ) : null}

          {canViewHseQueue ? (
            <Button
              accessibilityLabel="Aprovação HSE"
              style={[styles.fullWidthShortcut, styles.hseShortcut]}
              variant="secondary"
              onPress={() => {
                router.push(hseApprovalQueueRoute);
              }}
            >
              Aprovação HSE
            </Button>
          ) : null}

          <Button
            accessibilityLabel="Meu perfil"
            style={styles.fullWidthShortcut}
            variant="ghost"
            onPress={() => {
              router.push(authRoutes.profile);
            }}
          >
            Meu perfil
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  email: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
    textAlign: "center",
  },
  fullWidthShortcut: {
    alignSelf: "stretch",
    width: "100%",
  },
  hseShortcut: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
  },
  notificationShortcut: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[4],
  },
  notificationShortcutText: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
  organizationCard: {
    alignItems: "center",
    marginTop: spacing[2],
    width: "100%",
  },
  organizationCode: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    textAlign: "center",
  },
  organizationLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  organizationName: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
  refreshing: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  refreshingText: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  scrollContent: {
    alignItems: "center",
    gap: spacing[3],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  shortcuts: {
    alignSelf: "stretch",
    gap: spacing[2],
    width: "100%",
  },
  shortcutsTitle: {
    alignSelf: "stretch",
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    marginTop: spacing[2],
    textTransform: "uppercase",
  },
  shortcutPressed: {
    opacity: 0.85,
  },
  title: {
    color: colors.primary,
    fontSize: typography.pageTitle.fontSize,
    fontWeight: typography.pageTitle.fontWeight,
  },
});
