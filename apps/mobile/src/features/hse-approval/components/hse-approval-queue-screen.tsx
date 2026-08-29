import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { authRoutes } from "@/lib/auth/routes";

import { HseApprovalEmpty } from "./hse-approval-empty";
import { HsePendingApprovalCard } from "./hse-pending-approval-card";
import { useMdhoPendingApprovals } from "../hooks";
import { HSE_APPROVAL_COPY } from "../utils/hse-approval-copy";

export function HseApprovalQueueScreen() {
  const router = useRouter();
  useRequirePermission("mdho.approve");

  const {
    items,
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    canViewQueue,
  } = useMdhoPendingApprovals();

  if (!canViewQueue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.forbidden}>
          <Text style={styles.forbiddenText}>{HSE_APPROVAL_COPY.forbiddenQueue}</Text>
        </View>
      </SafeAreaView>
    );
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

        <Text style={styles.title}>{HSE_APPROVAL_COPY.queueTitle}</Text>
        <Text style={styles.subtitle}>{HSE_APPROVAL_COPY.queueSubtitle}</Text>
      </View>

      {isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{HSE_APPROVAL_COPY.queueLoadError}</Text>
          <Button
            accessibilityLabel="Tentar novamente"
            variant="secondary"
            onPress={() => {
              void refetch();
            }}
          >
            Tentar novamente
          </Button>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.assessmentId}
          ListEmptyComponent={<HseApprovalEmpty />}
          ListFooterComponent={
            hasNextPage ? (
              <Button
                accessibilityLabel="Carregar mais"
                loading={isFetchingNextPage}
                style={styles.loadMoreButton}
                variant="ghost"
                onPress={() => {
                  void fetchNextPage();
                }}
              >
                {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
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
          renderItem={({ item }) => <HsePendingApprovalCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    color: colors.primary,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
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
    color: colors.destructive,
    fontSize: typography.label.fontSize,
  },
  forbidden: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  forbiddenText: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    textAlign: "center",
  },
  header: {
    gap: spacing[1],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  listContent: {
    gap: spacing[3],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  loadMoreButton: {
    alignSelf: "center",
    marginTop: spacing[2],
  },
  subtitle: {
    color: statusChip.warning.foreground,
    fontSize: typography.label.fontSize,
  },
  title: {
    color: statusChip.warning.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
});
