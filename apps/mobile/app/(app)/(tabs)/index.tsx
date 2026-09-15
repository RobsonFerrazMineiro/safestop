import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@safestop/ui";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { showHseApprovalQueue } from "@/features/hse-approval";
import {
  HomeHeader,
  MobileHomeAttentionSection,
  MobileHomeOperationalSection,
  MobileHomeRecentOccurrencesSection,
  useHomePendingData,
} from "@/features/dashboard";
import { shouldShowHseApprovalCta } from "@/features/dashboard/utils/should-show-hse-approval-cta";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

export default function AuthenticatedHomeScreen() {
  const { user, isRefreshing } = useAuth();
  const { can, isPlatformAdmin } = useAuthorization();
  const { activeOrganization, hasMultipleOrganizations } = useActiveOrganization();
  const { profile } = useProfile();
  const homeData = useHomePendingData();
  const {
    refresh: refreshHomeData,
    isFetching: isHomeFetching,
    kpis,
    operationalMetricKeys,
    recentOccurrences,
    isRecentLoading,
    isRecentError,
    recentEnabled,
    can: canPermission,
    canAny,
    ...attentionSectionProps
  } = homeData;
  const [isRefreshingHome, setIsRefreshingHome] = useState(false);

  const canViewHseQueue = showHseApprovalQueue({
    currentUserId: user?.id ?? "",
    isPlatformAdmin,
    permissions: {
      mdhoApprove: can("mdho.approve"),
      mdhoReturn: can("mdho.return"),
    },
  });

  const showHseApprovalCta = shouldShowHseApprovalCta({
    canViewHseQueue,
    mdhoPendingApproval: kpis?.managerial.mdhoPendingApproval,
    operationalMetricKeys,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshingHome(true);

    try {
      await refreshHomeData();
    } finally {
      setIsRefreshingHome(false);
    }
  }, [refreshHomeData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={isRefreshingHome || isHomeFetching}
            tintColor={colors.primary}
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        }
      >
        {activeOrganization ? (
          <HomeHeader
            fullName={profile?.full_name}
            hasMultipleOrganizations={hasMultipleOrganizations}
            jobTitle={profile?.job_title}
            organizationName={activeOrganization.name}
          />
        ) : null}

        {isRefreshing ? (
          <View style={styles.refreshing}>
            <Text style={styles.refreshingText}>Revalidando sessão…</Text>
          </View>
        ) : null}

        <MobileHomeAttentionSection
          {...attentionSectionProps}
          can={canPermission}
          canAny={canAny}
          onRetry={() => {
            void refreshHomeData();
          }}
        />

        <MobileHomeOperationalSection
          enabled={attentionSectionProps.enabled}
          hasCachedData={attentionSectionProps.hasCachedData}
          isError={attentionSectionProps.isError}
          isLoading={attentionSectionProps.isLoading}
          isOnline={attentionSectionProps.isOnline}
          kpis={kpis}
          metricKeys={operationalMetricKeys}
          showHseApprovalCta={showHseApprovalCta}
          onRetry={() => {
            void refreshHomeData();
          }}
        />

        <MobileHomeRecentOccurrencesSection
          enabled={recentEnabled}
          isError={isRecentError}
          isLoading={isRecentLoading}
          items={recentOccurrences}
          onRetry={() => {
            void refreshHomeData();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  refreshing: {
    alignItems: "flex-start",
  },
  refreshingText: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  scrollContent: {
    alignSelf: "stretch",
    gap: spacing[4],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
});
