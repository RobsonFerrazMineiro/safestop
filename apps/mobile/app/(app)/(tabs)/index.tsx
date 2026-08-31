import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { Bell, ClipboardCheck, List, Plus, User, type LucideIcon } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Card } from "@/components/ui";
import { Can } from "@/features/authorization/components/can";
import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { MobileHomePendingSection, useHomePendingData } from "@/features/dashboard";
import { DASHBOARD_COPY } from "@/features/dashboard/utils/dashboard-copy";
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

const SHORTCUT_ICON_SIZE = 18;

type HomeShortcutTileProps = {
  accessibilityLabel: string;
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "secondary" | "ghost";
  trailing?: ReactNode;
};

function HomeShortcutTile({
  accessibilityLabel,
  label,
  Icon,
  onPress,
  style,
  variant = "default",
  trailing,
}: HomeShortcutTileProps) {
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.shortcutTile,
        isSecondary && styles.shortcutTileSecondary,
        isGhost && styles.shortcutTileGhost,
        pressed && styles.shortcutPressed,
        style,
      ]}
      onPress={onPress}
    >
      <Icon
        accessible={false}
        color={isGhost ? colors.foregroundMuted : colors.primary}
        size={SHORTCUT_ICON_SIZE}
        strokeWidth={2}
      />
      <Text numberOfLines={1} style={[styles.shortcutLabel, isGhost && styles.shortcutLabelGhost]}>
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

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
        <View style={styles.header}>
          <Text style={styles.title}>SafeStop</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>

        {activeOrganization ? (
          <Card style={styles.organizationCard} variant="muted">
            <Text style={styles.organizationLabel}>Organização ativa</Text>
            <Text numberOfLines={2} style={styles.organizationName}>
              {activeOrganization.name}
            </Text>
            {activeOrganization.code ? (
              <Text style={styles.organizationCode}>{activeOrganization.code}</Text>
            ) : null}
            {hasMultipleOrganizations ? (
              <Pressable
                accessibilityLabel="Trocar organização"
                accessibilityRole="button"
                style={({ pressed }) => [styles.switchOrgLink, pressed && styles.shortcutPressed]}
                onPress={() => {
                  router.push(authRoutes.organizations);
                }}
              >
                <Text style={styles.switchOrgText}>Trocar organização</Text>
              </Pressable>
            ) : null}
          </Card>
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
          {DASHBOARD_COPY.shortcutsTitle}
        </Text>

        <View style={styles.shortcutsGrid}>
          <Can permission="occurrence.read">
            <HomeShortcutTile
              accessibilityLabel="Ver paralisações"
              Icon={List}
              label="Paralisações"
              style={styles.shortcutGridItem}
              onPress={() => {
                router.push(stopWorkRoute);
              }}
            />
          </Can>

          {canViewNotifications ? (
            <HomeShortcutTile
              accessibilityLabel={notificationBadgeLabel}
              Icon={Bell}
              label="Notificações"
              style={styles.shortcutGridItem}
              trailing={<NotificationTabBadge counts={{ unreadCount, pendingAwarenessCount }} />}
              onPress={() => {
                router.push(notificationsRoute);
              }}
            />
          ) : null}

          <Can permission="occurrence.create">
            <HomeShortcutTile
              accessibilityLabel="Nova paralisação preventiva"
              Icon={Plus}
              label="Nova Paralisação"
              style={styles.shortcutGridItem}
              variant="secondary"
              onPress={() => {
                router.push(stopWorkNewRoute);
              }}
            />
          </Can>

          <HomeShortcutTile
            accessibilityLabel="Meu perfil"
            Icon={User}
            label="Meu perfil"
            style={styles.shortcutGridItem}
            variant="ghost"
            onPress={() => {
              router.push(authRoutes.profile);
            }}
          />
        </View>

        {canViewHseQueue ? (
          <HomeShortcutTile
            accessibilityLabel="Aprovação HSE"
            Icon={ClipboardCheck}
            label="Aprovação HSE"
            style={styles.hseShortcut}
            variant="secondary"
            onPress={() => {
              router.push(hseApprovalQueueRoute);
            }}
          />
        ) : null}
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
    fontSize: typography.helper.fontSize,
  },
  header: {
    alignSelf: "stretch",
    gap: spacing[1] / 2,
  },
  hseShortcut: {
    alignSelf: "stretch",
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    maxWidth: "100%",
    minWidth: "100%",
  },
  organizationCard: {
    alignSelf: "stretch",
    gap: spacing[1],
    padding: spacing[3],
    width: "100%",
  },
  organizationCode: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  organizationLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  organizationName: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
  },
  refreshing: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  refreshingText: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  scrollContent: {
    alignSelf: "stretch",
    gap: spacing[3],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  shortcutGridItem: {
    flexBasis: "48%",
    flexGrow: 1,
    maxWidth: "48%",
    minWidth: "48%",
  },
  shortcutLabel: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  shortcutLabelGhost: {
    color: colors.foregroundMuted,
    fontWeight: "500",
  },
  shortcutPressed: {
    opacity: 0.85,
  },
  shortcutsGrid: {
    columnGap: spacing[2],
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing[2],
  },
  shortcutsTitle: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    marginTop: spacing[1],
    textTransform: "uppercase",
  },
  shortcutTile: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[3],
  },
  shortcutTileGhost: {
    backgroundColor: colors.surfaceMuted,
  },
  shortcutTileSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  switchOrgLink: {
    alignSelf: "flex-start",
    marginTop: spacing[1],
    minHeight: controlHeight.mobile,
    justifyContent: "center",
  },
  switchOrgText: {
    color: colors.primary,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  title: {
    color: colors.primary,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
});
