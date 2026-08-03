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
          <Pressable
            accessibilityLabel="Tentar novamente"
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            onPress={() => {
              void refetch();
            }}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.assessmentId}
          ListEmptyComponent={<HseApprovalEmpty />}
          ListFooterComponent={
            hasNextPage ? (
              <Pressable
                accessibilityLabel="Carregar mais"
                accessibilityRole="button"
                disabled={isFetchingNextPage}
                style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}
                onPress={() => {
                  void fetchNextPage();
                }}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator color="#FBBF24" size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>Carregar mais</Text>
                )}
              </Pressable>
            ) : null
          }
          refreshControl={
            <RefreshControl
              colors={["#D97706"]}
              refreshing={isFetching && !isFetchingNextPage}
              tintColor="#D97706"
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
    color: "#FBBF24",
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
  forbidden: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  forbiddenText: {
    color: "#F9FAFB",
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    gap: 4,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 8,
  },
  loadMoreText: {
    color: "#FBBF24",
    fontSize: 14,
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
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  retryText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    color: "#FCD34D",
    fontSize: 14,
  },
  title: {
    color: "#FBBF24",
    fontSize: 24,
    fontWeight: "700",
  },
});
