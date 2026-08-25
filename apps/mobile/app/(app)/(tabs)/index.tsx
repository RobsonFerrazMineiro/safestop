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
            colors={["#F97316"]}
            refreshing={isRefreshingHome || isPendingFetching}
            tintColor="#F97316"
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        }
      >
        <Text style={styles.title}>SafeStop</Text>
        <Text style={styles.subtitle}>Sessão autenticada</Text>
        <Text style={styles.email}>{user?.email ?? "Usuário autenticado"}</Text>

        {activeOrganization ? (
          <View style={styles.organizationBadge}>
            <Text style={styles.organizationLabel}>Organização ativa</Text>
            <Text style={styles.organizationName}>{activeOrganization.name}</Text>
            {activeOrganization.code ? (
              <Text style={styles.organizationCode}>{activeOrganization.code}</Text>
            ) : null}
          </View>
        ) : null}

        {hasMultipleOrganizations ? (
          <Pressable
            accessibilityLabel="Trocar organização"
            accessibilityRole="button"
            style={({ pressed }) => [styles.switchOrgButton, pressed && styles.buttonPressed]}
            onPress={() => {
              router.push(authRoutes.organizations);
            }}
          >
            <Text style={styles.switchOrgButtonText}>Trocar organização</Text>
          </Pressable>
        ) : null}

        {isRefreshing ? (
          <View style={styles.refreshing}>
            <ActivityIndicator color="#F97316" size="small" />
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

        <Can permission="occurrence.read">
          <Pressable
            accessibilityLabel="Ver paralisações"
            accessibilityRole="button"
            style={({ pressed }) => [styles.occurrencesButton, pressed && styles.buttonPressed]}
            onPress={() => {
              router.push(stopWorkRoute);
            }}
          >
            <Text style={styles.occurrencesButtonText}>Paralisações</Text>
          </Pressable>
        </Can>

        <Can permission="occurrence.create">
          <Pressable
            accessibilityLabel="Nova paralisação preventiva"
            accessibilityRole="button"
            style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
            onPress={() => {
              router.push(stopWorkNewRoute);
            }}
          >
            <Text style={styles.createButtonText}>Nova Paralisação</Text>
          </Pressable>
        </Can>

        {canViewNotifications ? (
          <Pressable
            accessibilityLabel={notificationBadgeLabel}
            accessibilityRole="button"
            style={({ pressed }) => [styles.notificationsButton, pressed && styles.buttonPressed]}
            onPress={() => {
              router.push(notificationsRoute);
            }}
          >
            <View style={styles.notificationsButtonInner}>
              <Text style={styles.notificationsButtonText}>Notificações</Text>
              <NotificationTabBadge counts={{ unreadCount, pendingAwarenessCount }} />
            </View>
          </Pressable>
        ) : null}

        {canViewHseQueue ? (
          <Pressable
            accessibilityLabel="Aprovação HSE"
            accessibilityRole="button"
            style={({ pressed }) => [styles.hseButton, pressed && styles.buttonPressed]}
            onPress={() => {
              router.push(hseApprovalQueueRoute);
            }}
          >
            <Text style={styles.hseButtonText}>Aprovação HSE</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityLabel="Meu perfil"
          accessibilityRole="button"
          style={({ pressed }) => [styles.profileButton, pressed && styles.buttonPressed]}
          onPress={() => {
            router.push(authRoutes.profile);
          }}
        >
          <Text style={styles.profileButtonText}>Meu perfil</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.85,
  },
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
  },
  createButtonText: {
    color: "#DBEAFE",
    fontSize: 16,
    fontWeight: "700",
  },
  email: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  hseButton: {
    alignItems: "center",
    backgroundColor: "#92400E",
    borderColor: "#D97706",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
  },
  hseButtonText: {
    color: "#FDE68A",
    fontSize: 16,
    fontWeight: "700",
  },
  notificationsButton: {
    alignItems: "center",
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
  },
  notificationsButtonInner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    position: "relative",
  },
  notificationsButtonText: {
    color: "#DBEAFE",
    fontSize: 16,
    fontWeight: "700",
  },
  occurrencesButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
  },
  occurrencesButtonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
  organizationBadge: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
  },
  organizationCode: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },
  organizationLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  organizationName: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
  },
  profileButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  refreshing: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  refreshingText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  scrollContent: {
    alignItems: "center",
    gap: 12,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  shortcutsTitle: {
    alignSelf: "stretch",
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  switchOrgButton: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 44,
    minWidth: 200,
    paddingHorizontal: 20,
  },
  switchOrgButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    color: "#F97316",
    fontSize: 32,
    fontWeight: "700",
  },
});
